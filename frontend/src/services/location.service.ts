import { apiFetch } from '@/lib/api';

export type Location = {
  id: string;
  name: string;
  tier: number;
  type: string | null;
  parentId: string | null;
  parent?: { id: string; name: string } | null;
};

// Backend-এর ResponseInterceptor সব response-কে
// { success, statusCode, data, timestamp } আকারে wrap করে দেয়।
type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp?: string;
};

export async function searchLocations(
  q: string,
  parentId?: string,
) {
  const params = new URLSearchParams({ q });
  if (parentId) params.set('parentId', parentId);

  return apiFetch<ApiEnvelope<Location[]>>(
    `/locations/search?${params.toString()}`,
  );
}

export async function getLocationChildren(
  parentId?: string,
) {
  const params = new URLSearchParams();
  if (parentId) params.set('parentId', parentId);

  return apiFetch<ApiEnvelope<Location[]>>(
    `/locations/children?${params.toString()}`,
  );
}

export async function getLocationPath(id: string) {
  return apiFetch<ApiEnvelope<Location[]>>(
    `/locations/${id}/path`,
  );
}

export async function createLocation(input: {
  name: string;
  parentId?: string;
  type?: string;
}) {
  return apiFetch<ApiEnvelope<Location>>('/locations', {
    method: 'POST',
    body: JSON.stringify(input),
  });
}
