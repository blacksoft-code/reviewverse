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