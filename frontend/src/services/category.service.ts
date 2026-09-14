import { apiFetch } from '@/lib/api';

export type Category = {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
};

type CategoriesResponse = {
  success: boolean;
  statusCode: number;
  data: Category[];
};

export async function getCategories() {
  return apiFetch<CategoriesResponse>('/categories');
}

// একটি category-এর details এবং সেই category-এর
// সব entities backend থেকে নিয়ে আসবে।
export async function getCategoryBySlug(
  slug: string,
) {
  return apiFetch<{
    success: boolean;
    statusCode: number;
    data: {
      id: string;
      name: string;
      slug: string;
      createdAt: string;

      // Category-এর ভিতরের entity list।
      entities: {
        id: string;
        name: string;
        slug: string;
        description: string | null;
        averageRating: number;
        categoryId: string;
        createdAt: string;
        updatedAt: string;
      }[];
    };
    timestamp: string;
  }>(
    `/categories/${encodeURIComponent(
      slug,
    )}`,
  );
}

// ─────────────────────────────
// NEW — Admin category CRUD
// ─────────────────────────────

type CategoryResponse = {
  success: boolean;
  statusCode: number;
  data: Category;
};

export async function createCategory(input: {
  name: string;
  slug: string;
}) {
  return apiFetch<CategoryResponse>(
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
  return apiFetch<CategoryResponse>(
    `/categories/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export async function deleteCategory(id: string) {
  return apiFetch<{
    success: boolean;
    statusCode: number;
    data: { message: string };
  }>(`/categories/${id}`, {
    method: 'DELETE',
  });
}