import { apiFetch } from '@/lib/api';

export type CreateReviewPayload = {
  rating: number;
  content: string;
  entityId: string;
};

export type Review = {
  id: string;
  rating: number;
  content: string;
  userId: string;
  entityId: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
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