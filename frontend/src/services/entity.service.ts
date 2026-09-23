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

// Backend-এর Top Rated API থেকে সর্বোচ্চ rating পাওয়া
// entities নিয়ে আসবে।
export async function getTopRated() {
  return apiFetch<{
    success: boolean;
    statusCode: number;
    data: Entity[];
    timestamp: string;
  }>('/entities/top-rated');
}

// Phase 4 — Location-aware search (category + offering filter + ranking)
export type LocationSort =
  | 'rating_desc'
  | 'rating_asc'
  | 'price_asc'
  | 'price_desc';

export async function getEntitiesByLocation(
  locationId: string,
  options?: {
    categoryId?: string;
    offeringType?: string;
    sort?: LocationSort;
  },
) {
  const params = new URLSearchParams();
  if (options?.categoryId)
    params.set('categoryId', options.categoryId);
  if (options?.offeringType)
    params.set('offeringType', options.offeringType);
  if (options?.sort) params.set('sort', options.sort);

  const qs = params.toString();

  return apiFetch<{
    success: boolean;
    statusCode: number;
    data: Entity[];
    timestamp: string;
  }>(
    `/entities/by-location/${locationId}${qs ? `?${qs}` : ''}`,
  );
}

export type CreateEntityPayload = {
  name: string;
  slug: string;
  categoryId: string;
  location: string;
};

export async function createEntity(
  payload: CreateEntityPayload,
) {
  return apiFetch<{
    id: string;
    name: string;
    slug: string;
    categoryId: string;
    location: string;
  }>('/entities', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export type EntityFollower = {
  id: string;
  name: string;
  createdAt: string;
};

export async function getEntityFollowersCount(
  entityId: string,
) {
  return apiFetch<{
    success: boolean;
    statusCode: number;
    data: number;
    timestamp: string;
  }>(
    `/entities/${entityId}/followers/count`,
  );
}

export async function getEntityFollowers(
  entityId: string,
) {
  return apiFetch<{
    success: boolean;
    statusCode: number;
    data: {
      id: string;
      userId: string;
      entityId: string;
      createdAt: string;
      user: EntityFollower;
    }[];
    timestamp: string;
  }>(
    `/entities/${entityId}/followers`,
  );
}