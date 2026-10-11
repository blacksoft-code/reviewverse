import { apiFetch } from '@/lib/api';
import type { ShareItem } from './share.service';

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
  media?: { id: string; url: string }[];
};

export type FeedPostMedia = {
  id: string;
  url: string;
};

export type FeedPost = {
  id: string;
  content: string;
  media: FeedPostMedia[];
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
    }
  | {
      // কেউ অন্যের review/post share করেছে
      type: 'share';
      id: string;
      createdAt: string;
      priority: number;
      share: ShareItem;
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