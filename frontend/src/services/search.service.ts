import { apiFetch } from '@/lib/api';

export type SearchUser = {
  id: string;
  name: string;
  createdAt: string;
};

export type SearchEntity = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  averageRating: number;

  category: {
    id: string;
    name: string;
    slug: string;
  };
};

export type SearchResponse = {
  users: SearchUser[];
  entities: SearchEntity[];
};

export async function search(
  query: string,
) {
  return apiFetch<{
    success: boolean;
    statusCode: number;
    data: SearchResponse;
    timestamp: string;
  }>(
    `/search?q=${encodeURIComponent(query)}`,
  );
}