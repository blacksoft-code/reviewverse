import { apiFetch } from '@/lib/api';

export type Offering = {
  id: string;
  entityId: string;
  name: string;
  type: string;
  price: number;
  description: string | null;
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

export async function getOfferingsByEntity(entityId: string) {
  return apiFetch<ApiEnvelope<Offering[]>>(
    `/offerings/entity/${entityId}`,
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
