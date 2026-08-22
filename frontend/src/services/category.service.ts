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

// NEW:
// একটি category-এর details এবং সেই category-এর
// সব entities backend থেকে নিয়ে আসবে।
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

      // NEW:
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