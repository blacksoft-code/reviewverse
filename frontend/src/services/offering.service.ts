import { apiFetch } from '@/lib/api';

export type Offering = {
  id: string;
  entityId: string;
  name: string;
  type: string;
  price: number;
  description: string | null;
  averageRating: number;
  // false = locked (plan-এর limit-এর বাইরে) — শুধু owner-এর dashboard-এ দেখা যায়
  isPublic: boolean;
  // Plan শেষ/কমলে এটা আগে public থাকবে (owner "pin" করেছে)
  isPinned: boolean;
  media: { id: string; url: string }[];
  createdAt: string;
  updatedAt: string;
};

// Backend-এর ResponseInterceptor সব response-কে
// { success, statusCode, data, timestamp } আকারে wrap করে দেয়।
type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp?: string;
};

export type CreateOfferingInput = {
  name: string;
  type: string;
  price: number;
  description?: string;
};

export type UpdateOfferingInput = Partial<CreateOfferingInput>;

// =========================
// PUBLIC
// =========================

// manage = true শুধু business dashboard-এর জন্য — owner/manager হলে locked
// offering সহ সব আসে। বাকি সব জায়গায় (public page, review form) শুধু public।
export async function getOfferingsByEntity(
  entityId: string,
  options?: { manage?: boolean },
) {
  return apiFetch<ApiEnvelope<Offering[]>>(
    `/offerings/entity/${entityId}${
      options?.manage ? '?manage=true' : ''
    }`,
  );
}

// Owner নিজে বাছে কোনটা public থাকবে (plan-এর limit-এর ভেতরে)
export async function setOfferingVisibility(
  offeringId: string,
  isPublic: boolean,
) {
  return apiFetch<ApiEnvelope<Offering>>(
    `/offerings/${offeringId}/visibility`,
    {
      method: 'PATCH',
      body: JSON.stringify({ isPublic }),
    },
  );
}

// =========================
// MANAGE (owner/manager/employee)
// =========================

export async function createOffering(
  entityId: string,
  input: CreateOfferingInput,
) {
  return apiFetch<ApiEnvelope<Offering>>(
    `/offerings/entity/${entityId}`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function updateOffering(
  offeringId: string,
  input: UpdateOfferingInput,
) {
  return apiFetch<ApiEnvelope<Offering>>(
    `/offerings/${offeringId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export async function deleteOffering(offeringId: string) {
  return apiFetch<ApiEnvelope<{ message: string }>>(
    `/offerings/${offeringId}`,
    { method: 'DELETE' },
  );
}

// Search box autocomplete — distinct offering type suggestion
export async function searchOfferingTypes(q: string) {
  return apiFetch<ApiEnvelope<string[]>>(
    `/offerings/types/search?q=${encodeURIComponent(q)}`,
  );
}

// Plan শেষ বা কমলে যেগুলো আগে public রাখতে চাও সেগুলো pin করা (সর্বোচ্চ ২০টা)
export async function setOfferingPinned(
  offeringId: string,
  isPinned: boolean,
) {
  return apiFetch<ApiEnvelope<Offering>>(
    `/offerings/${offeringId}/pin`,
    {
      method: 'PATCH',
      body: JSON.stringify({ isPinned }),
    },
  );
}
