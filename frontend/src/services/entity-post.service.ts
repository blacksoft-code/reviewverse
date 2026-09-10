import { apiFetch } from '@/lib/api';

export type EntityPostAuthor = {
  id: string;
  name: string;
  email: string;
};

export type EntityPostSummaryEntity = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
};

// Public feed / single post — author info নেই
export type PublicEntityPost = {
  id: string;
  content: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  entity: EntityPostSummaryEntity;
};

// Manage feed — author (কে পোস্ট করেছে) সহ
export type ManagedEntityPost = {
  id: string;
  entityId: string;
  authorId: string;
  content: string;
  image: string | null;
  createdAt: string;
  updatedAt: string;
  author: EntityPostAuthor;
};

// Backend-এর ResponseInterceptor সব response-কে
// { success, statusCode, data, timestamp } আকারে wrap করে দেয়।
type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  data: T;
  timestamp?: string;
};

export type CreateEntityPostInput = {
  content: string;
  image?: string;
};

export type UpdateEntityPostInput = {
  content?: string;
  image?: string;
};

// =========================
// PUBLIC
// =========================

export async function getPublicFeed(entityId: string) {
  return apiFetch<ApiEnvelope<PublicEntityPost[]>>(
    `/entity-posts/entity/${entityId}`,
  );
}

export async function getPublicPost(postId: string) {
  return apiFetch<ApiEnvelope<PublicEntityPost>>(
    `/entity-posts/${postId}`,
  );
}

// =========================
// MANAGE (owner/manager/employee)
// =========================

export async function getManageFeed(entityId: string) {
  return apiFetch<ApiEnvelope<ManagedEntityPost[]>>(
    `/entity-posts/entity/${entityId}/manage`,
  );
}

export async function createPost(
  entityId: string,
  input: CreateEntityPostInput,
) {
  return apiFetch<ApiEnvelope<ManagedEntityPost>>(
    `/entity-posts/entity/${entityId}`,
    {
      method: 'POST',
      body: JSON.stringify(input),
    },
  );
}

export async function updatePost(
  postId: string,
  input: UpdateEntityPostInput,
) {
  return apiFetch<ApiEnvelope<ManagedEntityPost>>(
    `/entity-posts/${postId}`,
    {
      method: 'PATCH',
      body: JSON.stringify(input),
    },
  );
}

export async function deletePost(postId: string) {
  return apiFetch<ApiEnvelope<{ message: string }>>(
    `/entity-posts/${postId}`,
    { method: 'DELETE' },
  );
}