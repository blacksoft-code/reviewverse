import { Prisma } from '@prisma/client';

// Share আর feed — দুই জায়গাতেই একই shape-এ original review/post সহ আনা হয়
export const SHARE_INCLUDE = {
  user: { select: { id: true, name: true } },
  review: {
    include: {
      user: { select: { id: true, name: true } },
      entity: {
        select: {
          id: true,
          name: true,
          slug: true,
          location: true,
        },
      },
      media: {
        select: { id: true, url: true },
        orderBy: { createdAt: 'asc' },
      },
    },
  },
  entityPost: {
    select: {
      id: true,
      content: true,
      createdAt: true,
      entityId: true,
      media: {
        select: { id: true, url: true },
        orderBy: { createdAt: 'asc' },
      },
      entity: {
        select: {
          id: true,
          name: true,
          slug: true,
          logo: true,
        },
      },
    },
  },
} satisfies Prisma.ShareInclude;

export type ShareRow = Prisma.ShareGetPayload<{
  include: typeof SHARE_INCLUDE;
}>;

// Frontend-এর feed type-এর সাথে মেলাতে entityPost → post
export function toShareDto(share: ShareRow) {
  return {
    id: share.id,
    caption: share.caption,
    createdAt: share.createdAt,
    userId: share.userId,
    user: share.user,
    review: share.review,
    post: share.entityPost,
  };
}

export type ShareDto = ReturnType<typeof toShareDto>;
