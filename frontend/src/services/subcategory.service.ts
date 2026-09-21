import { apiFetch } from '@/lib/api';

export type SubCategory = {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
  createdAt: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  data: T;
};

export async function getSubCategories(
  categoryId?: string,
) {
  const query = categoryId
    ? `?categoryId=${encodeURIComponent(categoryId)}`
    : '';
  return apiFetch<ApiEnvelope<SubCategory[]>>(
    `/sub-categories${query}`,
  );
}

export async function createSubCategory(input: {
  name: string;
  slug: string;
  categoryId: string;
}) {
  return apiFetch<ApiEnvelope<SubCategory>>(
    '/sub-categories',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function updateSubCategory(
  id: string,
  input: {
    name?: string;
    slug?: string;
    categoryId?: string;
  },
) {
  return apiFetch<ApiEnvelope<SubCategory>>(
    `/sub-categories/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export async function deleteSubCategory(id: string) {
  return apiFetch<ApiEnvelope<{ message: string }>>(
    `/sub-categories/${id}`,
    { method: 'DELETE' },
  );
}