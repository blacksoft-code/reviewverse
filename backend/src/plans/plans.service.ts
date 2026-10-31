import {
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import {
  BadgeOverride,
  BillingCycle,
  EntitySubscription,
  PlanTier,
  SubscriptionSource,
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

import {
  GRACE_DAYS,
  PLANS,
  PLAN_RANK,
  PlanConfig,
  RENEWAL_REMINDER_DAYS,
} from './plans.config';

const DAY_MS = 24 * 60 * 60 * 1000;

// ACTIVE = মেয়াদের ভেতরে, GRACE = মেয়াদ শেষ কিন্তু ৩ দিনের ভেতরে (সুবিধা চালু),
// FREE = কোনো paid plan নেই (বা grace-ও শেষ)
export type PlanStatus = 'FREE' | 'ACTIVE' | 'GRACE';

// Blue badge-এর অবস্থা। missing = AUTO মোডে কী কী বাকি (VERIFICATION / PAID_PLAN)
export type BadgeState = {
  show: boolean;
  mode: BadgeOverride;
  isVerified: boolean;
  missing: ('VERIFICATION' | 'PAID_PLAN')[];
};

export type EffectivePlan = {
  tier: PlanTier;
  status: PlanStatus;
  billingCycle: BillingCycle | null;
  endsAt: Date | null;
  graceEndsAt: Date | null;
  // মেয়াদ শেষে যে বদল কার্যকর হবে (downgrade, মাসিক↔বার্ষিক, বাতিল)
  nextPlan: PlanTier | null;
  nextBillingCycle: BillingCycle | null;
  config: PlanConfig;
};

// changePlan-এর ফল
export type ChangeResult = {
  // NOW = এখনই শুরু, SCHEDULED = মেয়াদ শেষে, RENEWED = মেয়াদ বাড়ানো, NO_CHANGE = কিছু বদলায়নি
  applied: 'NOW' | 'SCHEDULED' | 'RENEWED' | 'NO_CHANGE';
  // SCHEDULED/RENEWED হলে কবে কার্যকর/শেষ
  effectiveAt: Date | null;
};

function addPeriod(from: Date, cycle: BillingCycle) {
  const d = new Date(from);

  if (cycle === 'YEARLY') {
    d.setFullYear(d.getFullYear() + 1);
  } else {
    d.setMonth(d.getMonth() + 1);
  }

  return d;
}

@Injectable()
export class PlansService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlansService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Start-এ আগের offering গুলোতে limit বসানো, তারপর প্রতি ঘণ্টায় plan-এর জীবনচক্র
  // (মেয়াদ শেষে নির্ধারিত বদল, reminder, grace, মেয়াদ-শেষ) সামলানো
  onModuleInit() {
    const run = async () => {
      try {
        await this.runLifecycle();
        await this.reconcileAll();
      } catch (e) {
        this.logger.error('Plan maintenance failed', e);
      }
    };

    run();
    this.timer = setInterval(run, 60 * 60 * 1000);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  // ─────────────────────────────
  // বর্তমান plan কী (grace-সহ)
  // ─────────────────────────────

  resolve(sub: EntitySubscription | null): EffectivePlan {
    const free: EffectivePlan = {
      tier: 'FREE',
      status: 'FREE',
      billingCycle: null,
      endsAt: null,
      graceEndsAt: null,
      nextPlan: null,
      nextBillingCycle: null,
      config: PLANS.FREE,
    };

    if (!sub) return free;

    const graceEndsAt = new Date(
      sub.endsAt.getTime() + GRACE_DAYS * DAY_MS,
    );
    const now = Date.now();

    if (now > graceEndsAt.getTime()) return free;

    return {
      tier: sub.plan,
      status: now <= sub.endsAt.getTime() ? 'ACTIVE' : 'GRACE',
      billingCycle: sub.billingCycle,
      endsAt: sub.endsAt,
      graceEndsAt,
      nextPlan: sub.nextPlan,
      nextBillingCycle: sub.nextBillingCycle,
      config: PLANS[sub.plan],
    };
  }

  async getEffectivePlan(entityId: string): Promise<EffectivePlan> {
    const sub = await this.prisma.entitySubscription.findUnique({
      where: { entityId },
    });

    return this.resolve(sub);
  }

  // ─────────────────────────────
  // Offering ব্যবহার বনাম limit
  // ─────────────────────────────

  async getUsage(entityId: string) {
    const [plan, totalCount, publicCount, pinnedCount] =
      await Promise.all([
        this.getEffectivePlan(entityId),
        this.prisma.offering.count({ where: { entityId } }),
        this.prisma.offering.count({
          where: { entityId, isPublic: true },
        }),
        this.prisma.offering.count({
          where: { entityId, isPinned: true },
        }),
      ]);

    return {
      plan,
      totalCount,
      publicCount,
      lockedCount: totalCount - publicCount,
      pinnedCount,
      publicLimit: plan.config.publicOfferingLimit,
      totalLimit: plan.config.totalOfferingLimit,
    };
  }

  // ─────────────────────────────
  // Lock করার নিয়ম
  // ─────────────────────────────

  // Public সংখ্যা limit পার হলে অতিরিক্তগুলো locked। কোনগুলো থাকবে:
  // আগে owner যেগুলো "pin" করেছে, তারপর সবচেয়ে পুরনোগুলো।
  async enforceLimit(entityId: string) {
    const { config } = await this.getEffectivePlan(entityId);

    const publicOfferings = await this.prisma.offering.findMany({
      where: { entityId, isPublic: true },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
      select: { id: true },
    });

    if (publicOfferings.length <= config.publicOfferingLimit) return;

    const toLock = publicOfferings
      .slice(config.publicOfferingLimit)
      .map((o) => o.id);

    await this.prisma.offering.updateMany({
      where: { id: { in: toLock } },
      data: { isPublic: false },
    });
  }

  // Public সংখ্যা limit-এর কম হলে locked গুলো খুলে দেওয়া (pin করা আগে, তারপর পুরনো)
  async fillToLimit(entityId: string) {
    const { config } = await this.getEffectivePlan(entityId);

    const publicCount = await this.prisma.offering.count({
      where: { entityId, isPublic: true },
    });

    const room = config.publicOfferingLimit - publicCount;

    if (room <= 0) return;

    const locked = await this.prisma.offering.findMany({
      where: { entityId, isPublic: false },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'asc' }],
      take: room,
      select: { id: true },
    });

    if (locked.length === 0) return;

    await this.prisma.offering.updateMany({
      where: { id: { in: locked.map((o) => o.id) } },
      data: { isPublic: true },
    });
  }

  // সব business-এর জন্য limit প্রয়োগ (start-এ আর প্রতি ঘণ্টায়; আবার চালালে ক্ষতি নেই)
  async reconcileAll() {
    const publicCounts = await this.prisma.offering.groupBy({
      by: ['entityId'],
      where: { isPublic: true },
      _count: { _all: true },
    });

    const candidates = publicCounts.filter(
      (c) => c._count._all > PLANS.FREE.publicOfferingLimit,
    );

    for (const c of candidates) {
      await this.enforceLimit(c.entityId);
    }
  }

  // plan বদলের পর limit অনুযায়ী ঠিক করা: বাড়লে locked খোলে, কমলে অতিরিক্ত locked হয়
  private async adjustToNewLimit(
    entityId: string,
    beforeLimit: number,
  ) {
    const after = await this.getEffectivePlan(entityId);

    if (after.config.publicOfferingLimit > beforeLimit) {
      await this.fillToLimit(entityId);
    } else {
      await this.enforceLimit(entityId);
    }
  }

  // ─────────────────────────────
  // Notification (business-এর সব member-কে, business bell-এ)
  // ─────────────────────────────

  private async notifyMembers(entityId: string, message: string) {
    const members = await this.prisma.entityMembership.findMany({
      where: { entityId },
      select: { userId: true },
    });

    await this.notifications.notifyMany(
      members.map((m) => m.userId),
      {
        type: 'PLAN_UPDATE',
        message,
        link: `/business/${entityId}/settings#plan`,
        entityId,
      },
    );
  }

  // ─────────────────────────────
  // Plan বদলের নিয়ম (Admin এখন; payment এলে সেটাও এই পথে)
  //  • Free/মেয়াদ-শেষ থেকে → এখনই শুরু
  //  • উঁচু plan-এ (upgrade) → এখনই, নতুন plan তখন থেকে শুরু
  //  • একই plan, একই cycle → renew (মেয়াদ বাড়ে)
  //  • নিচু plan (downgrade), মাসিক↔বার্ষিক, বা Free (বাতিল) → চলতি মেয়াদ শেষ হলে
  //  • Grace-এ থাকলে (মেয়াদ আগেই শেষ) → এখনই শুরু
  // ─────────────────────────────

  async changePlan(
    entityId: string,
    plan: PlanTier,
    billingCycle: BillingCycle = 'MONTHLY',
    source: SubscriptionSource = 'ADMIN',
  ): Promise<ChangeResult> {
    await this.requireEntity(entityId);

    const sub = await this.prisma.entitySubscription.findUnique({
      where: { entityId },
    });
    const current = this.resolve(sub);

    // কোনো paid plan চলছে না → এখনই
    if (!sub || current.tier === 'FREE') {
      if (plan === 'FREE') {
        return { applied: 'NO_CHANGE', effectiveAt: null };
      }

      await this.applyNow(entityId, plan, billingCycle, source);
      return { applied: 'NOW', effectiveAt: null };
    }

    // Grace-এ: পুরনো মেয়াদ শেষ, তাই নতুন plan এখনই
    if (current.status === 'GRACE') {
      if (plan === 'FREE') {
        await this.applyNow(entityId, 'FREE', billingCycle, source);
        return { applied: 'NOW', effectiveAt: null };
      }

      await this.applyNow(entityId, plan, billingCycle, source);
      return { applied: 'NOW', effectiveAt: null };
    }

    // Free-তে নামা = বাতিল, চলতি মেয়াদ শেষে
    if (plan === 'FREE') {
      await this.prisma.entitySubscription.update({
        where: { entityId },
        data: { nextPlan: 'FREE', nextBillingCycle: null },
      });

      return { applied: 'SCHEDULED', effectiveAt: sub.endsAt };
    }

    // Upgrade → এখনই
    if (PLAN_RANK[plan] > PLAN_RANK[current.tier]) {
      await this.applyNow(entityId, plan, billingCycle, source);
      return { applied: 'NOW', effectiveAt: null };
    }

    // Renew: একই plan, একই cycle → মেয়াদ বাড়ে
    if (plan === sub.plan && billingCycle === sub.billingCycle) {
      const base = new Date(
        Math.max(Date.now(), sub.endsAt.getTime()),
      );
      const endsAt = addPeriod(base, billingCycle);

      await this.prisma.entitySubscription.update({
        where: { entityId },
        data: {
          endsAt,
          nextPlan: null,
          nextBillingCycle: null,
          renewalReminderSentAt: null,
          graceNoticeSentAt: null,
          source,
        },
      });

      return { applied: 'RENEWED', effectiveAt: endsAt };
    }

    // Downgrade, বা একই plan-এ cycle বদল → চলতি মেয়াদ শেষে
    await this.prisma.entitySubscription.update({
      where: { entityId },
      data: { nextPlan: plan, nextBillingCycle: billingCycle },
    });

    return { applied: 'SCHEDULED', effectiveAt: sub.endsAt };
  }

  // Admin-এর override: নিয়ম না মেনে এখনই বসানো
  async setPlan(
    entityId: string,
    plan: PlanTier,
    billingCycle: BillingCycle = 'MONTHLY',
  ) {
    await this.requireEntity(entityId);
    await this.applyNow(entityId, plan, billingCycle, 'ADMIN');

    return this.getUsage(entityId);
  }

  // নতুন plan এখনই শুরু (পুরো নতুন মেয়াদ), তারপর limit মেলানো
  private async applyNow(
    entityId: string,
    plan: PlanTier,
    billingCycle: BillingCycle,
    source: SubscriptionSource,
  ) {
    const before = await this.getEffectivePlan(entityId);

    if (plan === 'FREE') {
      await this.prisma.entitySubscription.deleteMany({
        where: { entityId },
      });
    } else {
      const startsAt = new Date();
      const endsAt = addPeriod(startsAt, billingCycle);

      await this.prisma.entitySubscription.upsert({
        where: { entityId },
        update: {
          plan,
          billingCycle,
          startsAt,
          endsAt,
          nextPlan: null,
          nextBillingCycle: null,
          renewalReminderSentAt: null,
          graceNoticeSentAt: null,
          source,
        },
        create: {
          entityId,
          plan,
          billingCycle,
          startsAt,
          endsAt,
          source,
        },
      });
    }

    await this.adjustToNewLimit(
      entityId,
      before.config.publicOfferingLimit,
    );
  }

  private async requireEntity(entityId: string) {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
      select: { id: true },
    });

    if (!entity) {
      throw new NotFoundException('Business not found.');
    }
  }

  // ─────────────────────────────
  // জীবনচক্র — প্রতি ঘণ্টায়:
  //  ১. মেয়াদ শেষ হওয়া নির্ধারিত বদল কার্যকর
  //  ২. মেয়াদ শেষ হওয়ার ৭ দিন আগে reminder
  //  ৩. মেয়াদ শেষ → grace শুরুর notification
  //  ৪. grace-ও শেষ → Free, অতিরিক্ত offering locked, notification
  // ─────────────────────────────

  async runLifecycle() {
    const now = new Date();

    // ১. নির্ধারিত বদল
    const scheduled = await this.prisma.entitySubscription.findMany({
      where: { endsAt: { lte: now }, nextPlan: { not: null } },
    });

    for (const sub of scheduled) {
      await this.applyScheduled(sub);
    }

    // ২. Reminder (যাদের নির্ধারিত বদল নেই)
    const soon = await this.prisma.entitySubscription.findMany({
      where: {
        endsAt: {
          gt: now,
          lte: new Date(now.getTime() + RENEWAL_REMINDER_DAYS * DAY_MS),
        },
        nextPlan: null,
        renewalReminderSentAt: null,
      },
    });

    for (const sub of soon) {
      await this.prisma.entitySubscription.update({
        where: { id: sub.id },
        data: { renewalReminderSentAt: now },
      });

      await this.notifyMembers(
        sub.entityId,
        `Your ${PLANS[sub.plan].name} plan ends on ${sub.endsAt.toLocaleDateString('en-GB')}. Renew to keep your services and blue badge.`,
      );
    }

    // ৩. Grace শুরু
    const graceCutoff = new Date(now.getTime() - GRACE_DAYS * DAY_MS);

    const inGrace = await this.prisma.entitySubscription.findMany({
      where: {
        endsAt: { lte: now, gt: graceCutoff },
        nextPlan: null,
        graceNoticeSentAt: null,
      },
    });

    for (const sub of inGrace) {
      await this.prisma.entitySubscription.update({
        where: { id: sub.id },
        data: { graceNoticeSentAt: now },
      });

      await this.notifyMembers(
        sub.entityId,
        `Your ${PLANS[sub.plan].name} plan has ended. You have ${GRACE_DAYS} days to renew before extra services are locked.`,
      );
    }

    // ৪. Grace-ও শেষ
    await this.enforceExpired();
  }

  // নির্ধারিত বদল মেয়াদ শেষে কার্যকর করা
  private async applyScheduled(sub: EntitySubscription) {
    const before = PLANS[sub.plan].publicOfferingLimit;

    if (!sub.nextPlan || sub.nextPlan === 'FREE') {
      // বাতিল — সাথে সাথে Free (grace নেই, কারণ এটা ইচ্ছাকৃত)
      await this.prisma.entitySubscription.delete({
        where: { id: sub.id },
      });
      await this.enforceLimit(sub.entityId);

      const locked = await this.prisma.offering.count({
        where: { entityId: sub.entityId, isPublic: false },
      });

      await this.notifyMembers(
        sub.entityId,
        locked > 0
          ? `Your plan has ended and you are now on the Free plan. ${locked} ${locked === 1 ? 'service is' : 'services are'} now locked.`
          : 'Your plan has ended and you are now on the Free plan.',
      );

      return;
    }

    const cycle = sub.nextBillingCycle ?? sub.billingCycle;

    await this.prisma.entitySubscription.update({
      where: { id: sub.id },
      data: {
        plan: sub.nextPlan,
        billingCycle: cycle,
        startsAt: sub.endsAt,
        endsAt: addPeriod(sub.endsAt, cycle),
        nextPlan: null,
        nextBillingCycle: null,
        renewalReminderSentAt: null,
        graceNoticeSentAt: null,
      },
    });

    await this.adjustToNewLimit(sub.entityId, before);

    await this.notifyMembers(
      sub.entityId,
      `Your plan is now ${PLANS[sub.nextPlan].name} (${cycle === 'YEARLY' ? 'yearly' : 'monthly'}).`,
    );
  }

  // মেয়াদ + ৩ দিন grace শেষ হওয়া subscription: সরিয়ে FREE-এর limit বসানো
  async enforceExpired() {
    const cutoff = new Date(Date.now() - GRACE_DAYS * DAY_MS);

    const expired = await this.prisma.entitySubscription.findMany({
      where: { endsAt: { lt: cutoff } },
      select: { id: true, entityId: true },
    });

    for (const sub of expired) {
      await this.prisma.entitySubscription.delete({
        where: { id: sub.id },
      });
      await this.enforceLimit(sub.entityId);

      const locked = await this.prisma.offering.count({
        where: { entityId: sub.entityId, isPublic: false },
      });

      await this.notifyMembers(
        sub.entityId,
        locked > 0
          ? `Your plan has ended. You are now on the Free plan and ${locked} ${locked === 1 ? 'service is' : 'services are'} locked.`
          : 'Your plan has ended. You are now on the Free plan.',
      );
    }
  }

  // ─────────────────────────────
  // BLUE BADGE
  //  FORCE_OFF → কখনোই না (plan থাকলেও)
  //  FORCE_ON  → সবসময় (verification বা plan ছাড়াই, Admin-এর উপহার)
  //  AUTO      → Verified এবং চালু paid plan (৩ দিনের grace-সহ) — দুটোই লাগে
  // ─────────────────────────────

  computeBadge(
    isVerified: boolean,
    mode: BadgeOverride,
    plan: EffectivePlan,
  ): BadgeState {
    if (mode === 'FORCE_OFF') {
      return { show: false, mode, isVerified, missing: [] };
    }

    if (mode === 'FORCE_ON') {
      return { show: true, mode, isVerified, missing: [] };
    }

    const missing: BadgeState['missing'] = [];

    if (!isVerified) missing.push('VERIFICATION');
    if (!plan.config.blueBadgeEligible) missing.push('PAID_PLAN');

    return { show: missing.length === 0, mode, isVerified, missing };
  }

  async getBadgeState(entityId: string): Promise<BadgeState> {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
      select: {
        isVerified: true,
        badgeOverride: true,
        subscription: true,
      },
    });

    if (!entity) {
      return {
        show: false,
        mode: 'AUTO',
        isVerified: false,
        missing: ['VERIFICATION', 'PAID_PLAN'],
      };
    }

    return this.computeBadge(
      entity.isVerified,
      entity.badgeOverride,
      this.resolve(entity.subscription),
    );
  }

  // ─────────────────────────────
  // ADMIN
  // ─────────────────────────────

  async adminListEntities(q?: string, take = 50) {
    const entities = await this.prisma.entity.findMany({
      where: q
        ? { name: { contains: q, mode: 'insensitive' } }
        : {},
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(take, 1), 100),
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        createdAt: true,
        isVerified: true,
        verifiedUntil: true,
        badgeOverride: true,
        subscription: true,
      },
    });

    return entities.map((e) => {
      const plan = this.resolve(e.subscription);

      return {
        id: e.id,
        name: e.name,
        slug: e.slug,
        logo: e.logo,
        createdAt: e.createdAt,
        isVerified: e.isVerified,
        verifiedUntil: e.verifiedUntil,
        plan: {
          tier: plan.tier,
          name: plan.config.name,
          status: plan.status,
          billingCycle: plan.billingCycle,
          endsAt: plan.endsAt,
          graceEndsAt: plan.graceEndsAt,
          nextPlan: plan.nextPlan,
          nextBillingCycle: plan.nextBillingCycle,
        },
        badge: this.computeBadge(e.isVerified, e.badgeOverride, plan),
      };
    });
  }

  async setBadgeMode(entityId: string, mode: BadgeOverride) {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
      select: { id: true, badgeOverride: true },
    });

    if (!entity) {
      throw new NotFoundException('Business not found.');
    }

    await this.prisma.entity.update({
      where: { id: entityId },
      data: { badgeOverride: mode },
    });

    // Business-এর সবাইকে জানানো (Admin দিলে বা বন্ধ করলে)
    if (mode !== entity.badgeOverride && mode !== 'AUTO') {
      const members = await this.prisma.entityMembership.findMany({
        where: { entityId },
        select: { userId: true },
      });

      await this.notifications.notifyMany(
        members.map((m) => m.userId),
        {
          type: 'VERIFICATION_UPDATE',
          message:
            mode === 'FORCE_ON'
              ? 'The ReviewVerse team gave your business the blue badge.'
              : 'The blue badge was turned off for your business by the ReviewVerse team.',
          link: `/business/${entityId}/settings`,
          entityId,
        },
      );
    }

    return this.getBadgeState(entityId);
  }
}
