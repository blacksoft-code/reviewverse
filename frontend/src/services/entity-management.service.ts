import { apiFetch } from '@/lib/api';
import { Category } from '@/services/entity.service';

// Backend-এর Entity model-এর পুরো editable shape
export type EntityDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;

  location: string | null;
  locationId: string | null;
  phone: string | null;
  website: string | null;
  email: string | null;

  priceRange: string | null;
  serviceOptions: string | null;

  coverPhoto: string | null;
  logo: string | null;

  amenities: { id: string; name: string }[];
  paymentMethods: { id: string; name: string }[];

  socialLinks: string | null;
  menu: string | null;

  averageRating: number;
  categoryId: string;
  category?: Category;

  createdAt: string;
  updatedAt: string;
};

type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp?: string;
};

export async function getEntityById(id: string) {
  return apiFetch<ApiEnvelope<EntityDetail>>(
    `/entities/id/${id}`,
  );
}

export type UpdateEntityInput = Partial<
  Omit<
    EntityDetail,
    | 'id'
    | 'slug'
    | 'averageRating'
    | 'categoryId'
    | 'category'
    | 'createdAt'
    | 'updatedAt'
    | 'amenities'
    | 'paymentMethods'
  >
> & {
  // amenities read করার সময় {id, name}[] আসে, কিন্তু update পাঠানোর
  // সময় শুধু id-গুলোর array পাঠাতে হয়
  amenityIds?: string[];
  paymentMethodIds?: string[];
};

export async function updateEntity(
  id: string,
  input: UpdateEntityInput,
) {
  return apiFetch<ApiEnvelope<EntityDetail>>(
    `/entities/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export async function reassignEntityCategory(
  entityId: string,
  categoryId: string,
  subCategoryId: string | null,
) {
  return apiFetch<ApiEnvelope<EntityDetail>>(
    `/entities/${entityId}/category`,
    {
      method: 'PATCH',
      body: JSON.stringify({ categoryId, subCategoryId }),
    },
  );
}