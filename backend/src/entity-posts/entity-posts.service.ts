import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { EntityMembershipsService } from '../entity-memberships/entity-memberships.service';

import { CreateEntityPostDto } from './dto/create-entity-post.dto';
import { UpdateEntityPostDto } from './dto/update-entity-post.dto';

@Injectable()
export class EntityPostsService {
  constructor(
    private prisma: PrismaService,
    private entityMemberships: EntityMembershipsService,
  ) {}

  // ─────────────────────────────
  // CREATE — owner/manager/employee যেকোনো membership role
  // ─────────────────────────────
  async create(
    entityId: string,
    userId: string,
    dto: CreateEntityPostDto,
  ) {
    const entity = await this.prisma.entity.findUnique({
      where: { id: entityId },
    });

    if (!entity) {
      throw new NotFoundException('Business not found.');
    }

    const hasAccess = await this.entityMemberships.hasAccess(
      entityId,
      userId,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'Only the business owner, manager, or employee can post as this business.',
      );
    }

    return this.prisma.entityPost.create({
      data: {
        entityId,
        authorId: userId,
        content: dto.content,
        image: dto.image,
      },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  // ─────────────────────────────
  // PUBLIC FEED — সবার জন্য দেখা যাবে ("KFC posted...")
  // কে (কোন employee) পোস্ট করেছে সেটা এখানে নেই
  // ─────────────────────────────
  async findPublic(entityId: string) {
    return this.prisma.entityPost.findMany({
      where: { entityId },
      select: {
        id: true,
        content: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        entity: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOnePublic(postId: string) {
    const post = await this.prisma.entityPost.findUnique({
      where: { id: postId },
      select: {
        id: true,
        content: true,
        image: true,
        createdAt: true,
        updatedAt: true,
        entity: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    return post;
  }

  // ─────────────────────────────
  // MANAGE FEED — শুধু owner/manager/employee-দের জন্য,
  // কে পোস্ট করেছে (author) সেটাও দেখাবে
  // ─────────────────────────────
  async findForManagers(entityId: string, userId: string) {
    const hasAccess = await this.entityMemberships.hasAccess(
      entityId,
      userId,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'Only the business owner, manager, or employee can view this.',
      );
    }

    return this.prisma.entityPost.findMany({
      where: { entityId },
      include: {
        author: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ─────────────────────────────
  // UPDATE — owner/manager/employee যে কেউ (শুধু original author না)
  // ─────────────────────────────
  async update(
    postId: string,
    userId: string,
    dto: UpdateEntityPostDto,
  ) {
    const post = await this.prisma.entityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const hasAccess = await this.entityMemberships.hasAccess(
      post.entityId,
      userId,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'Only the business owner, manager, or employee can edit this post.',
      );
    }

    return this.prisma.entityPost.update({
      where: { id: postId },
      data: {
        content: dto.content,
        image: dto.image,
      },
    });
  }

  // ─────────────────────────────
  // DELETE — owner/manager/employee যে কেউ
  // ─────────────────────────────
  async remove(postId: string, userId: string) {
    const post = await this.prisma.entityPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Post not found.');
    }

    const hasAccess = await this.entityMemberships.hasAccess(
      post.entityId,
      userId,
    );

    if (!hasAccess) {
      throw new ForbiddenException(
        'Only the business owner, manager, or employee can delete this post.',
      );
    }

    await this.prisma.entityPost.delete({
      where: { id: postId },
    });

    return { message: 'Post deleted successfully' };
  }
}