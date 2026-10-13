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

// "কে কে react করেছে" — modal-এর এক সারি
export type Reactor = {
  userId: string;
  name: string;
  type: ReactionType;
  createdAt: string;
  // business হিসেবে react করলে business-এর তথ্য
  entity: { id: string; name: string; slug: string; logo: string | null } | null;
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

export async function getReviewReactors(reviewId: string) {
  return apiFetch<ApiEnvelope<Reactor[]>>(
    `/reviews/${reviewId}/reactions/users`,
  );
}
