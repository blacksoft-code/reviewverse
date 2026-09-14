import { apiFetch } from '@/lib/api';

export type ReactionType =
  | 'HELPFUL'
  | 'LOVE'
  | 'ACCURATE'
  | 'HAHA'
  | 'DISLIKE';

export type ReactionSummary = {
  total: number;
  counts: Record<ReactionType, number>;
  myReaction: ReactionType | null;
};

type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  data: T;
};

export async function reactToReview(
  reviewId: string,
  type: ReactionType,
) {
  return apiFetch<ApiEnvelope<unknown>>(
    `/reviews/${reviewId}/reactions`,
    {
      method: 'POST',
      body: JSON.stringify({ type }),
    },
  );
}

export async function unreactToReview(
  reviewId: string,
) {
  return apiFetch<ApiEnvelope<unknown>>(
    `/reviews/${reviewId}/reactions`,
    { method: 'DELETE' },
  );
}

export async function getReactionSummary(
  reviewId: string,
) {
  return apiFetch<ApiEnvelope<ReactionSummary>>(
    `/reviews/${reviewId}/reactions/summary`,
  );
}