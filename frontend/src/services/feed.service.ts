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
};

export type FeedPost = {
  id: string;
  content: string;
  image: string | null;
  createdAt: string;
  entity: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
  };
};

export type FeedEntry =
  | {
      type: 'review';
      id: string;
      createdAt: string;
      priority: number;
      review: FeedReview;
    }
  | {
      type: 'post';
      id: string;
      createdAt: string;
      priority: number;
      post: FeedPost;
    };

export type FeedPage = {
  items: FeedEntry[];
  hasMore: boolean;
  total: number;
};

type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  data: T;
};

export async function getFeed(
  skip: number,
  take: number,
) {
  return apiFetch<ApiEnvelope<FeedPage>>(
    `/feed?skip=${skip}&take=${take}`,
  );
}

export async function getNewSince(since: string) {
  return apiFetch<ApiEnvelope<{ count: number }>>(
    `/feed/new-since?since=${encodeURIComponent(
      since,
    )}`,
  );
}