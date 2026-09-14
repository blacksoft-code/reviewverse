import { apiFetch } from '@/lib/api';

export type Category = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  data: T;
};

export async function getCategories() {
  return apiFetch<ApiEnvelope<Category[]>>(
    '/categories',
  );
}

export async function createCategory(input: {
  name: string;
  slug: string;
}) {
  return apiFetch<ApiEnvelope<Category>>(
    '/categories',
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function updateCategory(
  id: string,
  input: { name?: string; slug?: string },
) {
  return apiFetch<ApiEnvelope<Category>>(
    `/categories/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export async function deleteCategory(id: string) {
  return apiFetch<ApiEnvelope<{ message: string }>>(
    `/categories/${id}`,
    { method: 'DELETE' },
  );
}