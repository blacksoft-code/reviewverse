import { apiFetch } from '@/lib/api';

export type CreateReviewPayload = {
  rating: number;
  content: string;
  entityId: string;
  offeringId?: string;
};

export type ReviewMedia = {
  id: string;
  url: string;
};

export type Review = {
  id: string;
  rating: number;
  content: string;
  userId: string;
  entityId: string;
  offeringId: string | null;
  offering?: {
    id: string;
    name: string;
  } | null;
  isLatest: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
  media?: ReviewMedia[];
};

export type CreateReviewResponse = {
  success: boolean;
  statusCode: number;
  data: Review;
  timestamp: string;
};

export async function createReview(
  payload: CreateReviewPayload,
) {
  return apiFetch<CreateReviewResponse>(
    '/reviews',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
  );
}

//update review

type UpdateReviewPayload = {
  rating: number;
  content: string;
};

export async function updateReview(
  reviewId: string,
  payload: UpdateReviewPayload,
) {
  return apiFetch(`/reviews/${reviewId}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export type DeleteReviewResponse = {
  message: string;
  promotedReview: Review | null;
};

export async function deleteReview(
  reviewId: string,
): Promise<DeleteReviewResponse> {
  return apiFetch(`/reviews/${reviewId}`, {
    method: 'DELETE',
  });
}