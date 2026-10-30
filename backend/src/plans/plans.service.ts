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
} from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

import { GRACE_DAYS, PLANS, PlanConfig } from './plans.config';

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
  config: PlanConfig;
};

@Injectable()
export class PlansService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PlansService.name);
  private timer?: NodeJS.Timeout;

  constructor(
    private prisma: PrismaService,
    private notifications: NotificationsService,
  ) {}

  // Start-এ আগের offering গুলোতে limit বসানো (যেমন Free business-এর ৮টার মধ্যে
  // ৫টা public, বাকি ৩টা locked), তারপর প্রতি ঘণ্টায় মেয়াদ-শেষ plan সামলানো
  onModuleInit() {
    const run = async () => {
      try {
        await this.enforceExpired();
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
    if (!sub) {
      return {
        tier: 'FREE',
        status: 'FREE',
        billingCycle: null,
        endsAt: null,
        graceEndsAt: null,
        config: PLANS.FREE,
      };
    }

    const graceEndsAt = new Date(
      sub.endsAt.getTime() + GRACE_DAYS * DAY_MS,
    );
    const now = Date.now();

    if (now <= sub.endsAt.getTime()) {
      return {
        tier: sub.plan,
        status: 'ACTIVE',
        billingCycle: sub.billingCycle,
        endsAt: sub.endsAt,
        graceEndsAt,
        config: PLANS[sub.plan],
      };
    }

    if (now <= graceEndsAt.getTime()) {
      return {
        tier: sub.plan,
        status: 'GRACE',
        billingCycle: sub.billingCycle,
        endsAt: sub.endsAt,
        graceEndsAt,
        config: PLANS[sub.plan],
      };
    }

    return {
      tier: 'FREE',
      status: 'FREE',
      billingCycle: null,
      endsAt: null,
      graceEndsAt: null,
      config: PLANS.FREE,
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
    const [plan, totalCount, publicCount] = await Promise.all([
      this.getEffectivePlan(entityId),
      this.prisma.offering.count({ where: { entityId } }),
      this.prisma.offering.count({
        where: { entityId, isPublic: true },
      }),
    ]);

    return {
      plan,
      totalCount,
      publicCount,
      lockedCount: totalCount - publicCount,
      publicLimit: plan.config.publicOfferingLimit,
      totalLimit: plan.config.totalOfferingLimit,
    };
  }

  // ─────────────────────────────
  // Lock করার নিয়ম
  // ─────────────────────────────

  // Public সংখ্যা limit পার হলে অতিরিক্তগুলো locked (সবচেয়ে নতুনগুলো আগে)।
  // Owner যেগুলো public রেখেছে সেটাই "বাছাই" — তাই পুরনোগুলো থেকে যায়।
  async enforceLimit(entityId: string) {
    const { config } = await this.getEffectivePlan(entityId);

    const publicOfferings = await this.prisma.offering.findMany({
      where: { entityId, isPublic: true },
      orderBy: { createdAt: 'asc' },
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

  // Public সংখ্যা limit-এর কম হলে সবচেয়ে পুরনো locked গুলো খুলে দেওয়া
  // (plan upgrade হলে, বা offering মুছে slot খালি হলে)
  async fillToLimit(entityId: string) {
    const { config } = await this.getEffectivePlan(entityId);

    const publicCount = await this.prisma.offering.count({
      where: { entityId, isPublic: true },
    });

    const room = config.publicOfferingLimit - publicCount;

    if (room <= 0) return;

    const locked = await this.prisma.offering.findMany({
      where: { entityId, isPublic: false },
      orderBy: { createdAt: 'asc' },
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

    // সবচেয়ে ছোট limit (Free) পার হওয়া business গুলোই শুধু দেখলে চলে
    const candidates = publicCounts.filter(
      (c) => c._count._all > PLANS.FREE.publicOfferingLimit,
    );

    for (const c of candidates) {
      await this.enforceLimit(c.entityId);
    }
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
    }
  }

  // ─────────────────────────────
  // Plan বসানো (এখন Admin হাতে; payment এলে সেটাও এই পথে আসবে)
  // ─────────────────────────────

  async setPlan(
    entityId: string,
    plan: PlanTier,
    billingCycle: BillingCycle = 'MONTHLY',
  ) {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
      select: { id: true },
    });

    if (!entity) {
      throw new NotFoundException('Business not found.');
    }

    const before = await this.getEffectivePlan(entityId);

    if (plan === 'FREE') {
      await this.prisma.entitySubscription.deleteMany({
        where: { entityId },
      });
    } else {
      const startsAt = new Date();
      const endsAt = new Date(startsAt);

      if (billingCycle === 'YEARLY') {
        endsAt.setFullYear(endsAt.getFullYear() + 1);
      } else {
        endsAt.setMonth(endsAt.getMonth() + 1);
      }

      await this.prisma.entitySubscription.upsert({
        where: { entityId },
        update: {
          plan,
          billingCycle,
          startsAt,
          endsAt,
          nextPlan: null,
          nextBillingCycle: null,
          source: 'ADMIN',
        },
        create: {
          entityId,
          plan,
          billingCycle,
          startsAt,
          endsAt,
          source: 'ADMIN',
        },
      });
    }

    // limit বাড়লে locked গুলো খুলে যায়, কমলে অতিরিক্তগুলো locked হয়
    const after = await this.getEffectivePlan(entityId);

    if (
      after.config.publicOfferingLimit >
      before.config.publicOfferingLimit
    ) {
      await this.fillToLimit(entityId);
    } else {
      await this.enforceLimit(entityId);
    }

    return this.getUsage(entityId);
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
