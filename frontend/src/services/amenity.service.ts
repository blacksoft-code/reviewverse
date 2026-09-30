import { apiFetch } from '@/lib/api';

export type Amenity = {
  id: string;
  name: string;
  createdAt: string;
};

type AmenitiesResponse = {
  success: boolean;
  statusCode: number;
  data: Amenity[];
};

type AmenityResponse = {
  success: boolean;
  statusCode: number;
  data: Amenity;
};

// GET /amenities — যেকেউ পড়তে পারবে (add-business form, business page)
export async function getAmenities() {
  return apiFetch<AmenitiesResponse>('/amenities');
}

// ─────────────────────────────
// [Admin] Amenity CRUD
// ─────────────────────────────

export async function createAmenity(name: string) {
  return apiFetch<AmenityResponse>('/amenities', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updateAmenity(
  id: string,
  name: string,
) {
  return apiFetch<AmenityResponse>(`/amenities/${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  });
}

export async function deleteAmenity(id: string) {
  return apiFetch<{
    success: boolean;
    statusCode: number;
    data: { message: string };
  }>(`/amenities/${id}`, {
    method: 'DELETE',
  });
}