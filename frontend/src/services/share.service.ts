import { apiFetch } from '@/lib/api';
import type { ReactionType, ReactionSummary } from './reaction.service';
import type { ReviewCommentReply } from './comment.service';

export type { ReactionType, ReactionSummary };

type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  data: T;
};

export type ShareMedia = { id: string; url: string };

export type ShareReview = {
  id: string;
  rating: number;
  content: string;
  userId: string;
  entityId: string;
  createdAt: string;
  updatedAt: string;
  user: { id: string; name: string };
  entity: {
    id: string;
    name: string;
    slug: string;
    location: string | null;
  };
  media: ShareMedia[];
};

export type SharePost = {
  id: string;
  content: string;
  createdAt: string;
  entityId: string;
  media: ShareMedia[];
  entity: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
};

// একটা share — হয় review, নয়তো post (ঠিক একটা null নয়)
export type ShareItem = {
  id: string;
  caption: string | null;
  createdAt: string;
  userId: string;
  user: { id: string; name: string };
  review: ShareReview | null;
  post: SharePost | null;
};

// ───────── share ───────────

export async function getShareCount(target: {
  reviewId?: string;
  entityPostId?: string;
}) {
  const query = target.reviewId
    ? `reviewId=${encodeURIComponent(target.reviewId)}`
    : `entityPostId=${encodeURIComponent(target.entityPostId ?? '')}`;

  return apiFetch<ApiEnvelope<{ count: number }>>(
    `/shares/summary?${query}`,
  );
}

export async function createShare(input: {
  reviewId?: string;
  entityPostId?: string;
  caption?: string;
}) {
  return apiFetch<ApiEnvelope<ShareItem>>('/shares', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}

export async function getShare(shareId: string) {
  return apiFetch<ApiEnvelope<ShareItem>>(`/shares/${shareId}`);
}

export async function getUserShares(userId: string) {
  return apiFetch<ApiEnvelope<ShareItem[]>>(
    `/shares/user/${userId}`,
  );
}

export async function deleteShare(shareId: string) {
  return apiFetch<ApiEnvelope<{ message: string }>>(
    `/shares/${shareId}`,
    { method: 'DELETE' },
  );
}

// ───────── reactions ───────────

export async function reactToShare(
  shareId: string,
  type: ReactionType,
) {
  return apiFetch<ApiEnvelope<unknown>>(
    `/shares/${shareId}/reactions`,
    { method: 'POST', body: JSON.stringify({ type }) },
  );
}

export async function unreactToShare(shareId: string) {
  return apiFetch<ApiEnvelope<unknown>>(
    `/shares/${shareId}/reactions`,
    { method: 'DELETE' },
  );
}

export async function getShareReactionSummary(shareId: string) {
  return apiFetch<ApiEnvelope<ReactionSummary>>(
    `/shares/${shareId}/reactions/summary`,
  );
}

// ───────── comments ───────────

export type ShareCommentReply = Omit<
  ReviewCommentReply,
  'reviewId' | 'entityId' | 'entity'
> & { shareId: string };

export type ShareCommentThread = ShareCommentReply & {
  replies: ShareCommentReply[];
};

export type ShareCommentsResponse = {
  comments: ShareCommentThread[];
  totalCount: number;
};

export async function getShareComments(shareId: string) {
  return apiFetch<ApiEnvelope<ShareCommentsResponse>>(
    `/shares/${shareId}/comments`,
  );
}

export async function createShareComment(
  shareId: string,
  content: string,
  parentId?: string,
) {
  return apiFetch<ApiEnvelope<ShareCommentReply>>(
    `/shares/${shareId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    },
  );
}

export async function deleteShareComment(commentId: string) {
  return apiFetch<ApiEnvelope<{ message: string }>>(
    `/shares/comments/${commentId}`,
    { method: 'DELETE' },
  );
}
