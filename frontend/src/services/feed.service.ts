import { apiFetch } from '@/lib/api';

export type FeedReview = {
  id: string;
  rating: number;
  content: string;
  userId: string;
  entityId: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
  };
  entity: {
    id: string;
    name: string;
    slug: string;
    location: string | null;
  };
  priority: number;
};

export type FeedResponse = {
  success: boolean;
  statusCode: number;
  data: FeedReview[];
};

export async function getFeed() {
  return apiFetch<FeedResponse>('/feed');
}