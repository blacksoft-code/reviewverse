import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { EntityMembershipsService } from '../entity-memberships/entity-memberships.service';
import { NotificationsService } from '../notifications/notifications.service';

import { CreateEntityQuestionDto } from './dto/create-entity-question.dto';
import { AnswerEntityQuestionDto } from './dto/answer-entity-question.dto';

@Injectable()
export class EntityQuestionsService {
  constructor(
    private prisma: PrismaService,
    private entityMemberships: EntityMembershipsService,
    private notifications: NotificationsService,
  ) {}

  // ─────────────────────────────
  // PUBLIC LIST — সবাই দেখতে পাবে।
  // userId থাকলে (লগইন করা) canAnswer = এই entity-র member কিনা।
  // কোন employee উত্তর দিয়েছে সেটা public-এ দেখানো হয় না
  // (entity-posts এর মতোই)।
  // ─────────────────────────────
  async findAll(entityId: string, userId?: string | null) {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
      select: { id: true },
    });

    if (!entity) {
      throw new NotFoundException('Business not found.');
    }

    const questions = await this.prisma.entityQuestion.findMany({
      where: { entityId },
      select: {
        id: true,
        question: true,
        answer: true,
        answeredAt: true,
        createdAt: true,
        asker: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const canAnswer = userId
      ? await this.entityMemberships.hasAccess(entityId, userId)
      : false;

    return {
      data: questions,
      meta: { canAnswer },
    };
  }

  // ─────────────────────────────
  // ASK — যেকোনো লগইন করা user
  // ─────────────────────────────
  async create(
    entityId: string,
    userId: string,
    dto: CreateEntityQuestionDto,
    actingEntityId?: string,
  ) {
    // Entity profile (entity mode) থেকে প্রশ্ন করা যাবে না —
    // প্রশ্ন করা একটা personal কাজ, তাই personal profile-এ ফিরতে হবে।
    if (actingEntityId) {
      throw new ForbiddenException(
        'Questions cannot be asked from a business profile. Switch back to your personal profile to ask.',
      );
    }

    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
      select: { id: true },
    });

    if (!entity) {
      throw new NotFoundException('Business not found.');
    }

    const created = await this.prisma.entityQuestion.create({
      data: {
        entityId,
        askerId: userId,
        question: dto.question.trim(),
      },
      select: {
        id: true,
        question: true,
        answer: true,
        answeredAt: true,
        createdAt: true,
        asker: { select: { id: true, name: true } },
      },
    });

    // Entity-র notification — entity-র সব member (owner/manager) পাবে।
    // Business mode-এ bell-এ দেখাবে (entityId দিয়ে filter হয়)।
    // Link সরাসরি entity profile-এর (manage) Q&A tab-এ যায়।
    const members = await this.prisma.entityMembership.findMany({
      where: { entityId },
      select: { userId: true },
    });

    await this.notifications.notifyMany(
      members.map((m) => m.userId),
      {
        actorId: userId,
        type: 'QUESTION_ASKED',
        message: 'asked a question on your business.',
        link: `/business/${entityId}?tab=qa&questionId=${created.id}`,
        entityId,
      },
    );

    return created;
  }

  // ─────────────────────────────
  // ANSWER (বা আগের answer edit) — শুধু ওই entity-র owner/manager
  // (EntityMembership আছে এমন user)। অন্য কেউ, এমনকি অন্য
  // entity-র owner-ও, পারবে না।
  // ─────────────────────────────
  async answer(
    questionId: string,
    userId: string,
    dto: AnswerEntityQuestionDto,
    actingEntityId?: string,
  ) {
    const question = await this.prisma.entityQuestion.findUnique({
      where: { id: questionId },
      include: {
        entity: { select: { id: true, name: true, slug: true } },
      },
    });

    if (!question) {
      throw new NotFoundException('Question not found.');
    }

    const hasAccess = await this.entityMemberships.hasAccess(
      question.entityId,
      userId,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'Only the owner or manager of this business can answer questions.',
      );
    }

    // Reply শুধু ঐ entity-র profile (entity mode) থেকেই — owner-এর
    // personal profile থেকে নয়।
    if (actingEntityId !== question.entityId) {
      throw new ForbiddenException(
        'Switch to this business profile to reply to questions.',
      );
    }

    const isFirstAnswer = question.answer === null;

    const updated = await this.prisma.entityQuestion.update({
      where: { id: questionId },
      data: {
        answer: dto.answer.trim(),
        answeredById: userId,
        answeredAt: new Date(),
      },
      select: {
        id: true,
        question: true,
        answer: true,
        answeredAt: true,
        createdAt: true,
        asker: { select: { id: true, name: true } },
      },
    });

    // User-এর notification — "<Entity name> replied to your question."
    // actorId ইচ্ছে করেই দেওয়া হয়নি: reply entity-র নামে যায়,
    // owner-এর ব্যক্তিগত নামে না। শুধু প্রথম reply-তে notify
    // (পরে edit করলে বারবার না)।
    if (isFirstAnswer && question.askerId !== userId) {
      await this.notifications.notify({
        recipientId: question.askerId,
        type: 'QUESTION_ANSWERED',
        message: `${question.entity.name} replied to your question.`,
        link: `/entities/${question.entity.slug}/qa?questionId=${question.id}`,
        entityId: question.entityId,
      });
    }

    return updated;
  }
}
