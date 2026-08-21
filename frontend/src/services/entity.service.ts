import { apiFetch } from '@/lib/api';

export type Category = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

export type Entity = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  averageRating: number;
  categoryId: string;
  createdAt: string;
  updatedAt: string;
  category: Category;
};

export type EntitiesResponse = {
  success: boolean;
  statusCode: number;
  data: Entity[];
  page: number;
  limit: number;
  total: number;
};

export async function getEntities(
  page = 1,
  limit = 10,
) {
  return apiFetch<EntitiesResponse>(
    `/entities?page=${page}&limit=${limit}`,
  );
}

export async function getEntityBySlug(
  slug: string,
) {
  return apiFetch<{
    success: boolean;
    statusCode: number;
    data: Entity;
  }>(
    `/entities/${decodeURIComponent(slug)}`,
  );
}

// NEW:
// Backend-এর search API ব্যবহার করে entity খুঁজবে.
export async function searchEntities(
  query: string,
) {
  return apiFetch<{
    success: boolean;
    statusCode: number;
    data: Entity[];
    timestamp: string;
  }>(
    `/entities/search?q=${encodeURIComponent(query)}`,
  );
}