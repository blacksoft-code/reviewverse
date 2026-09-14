import { apiFetch } from '@/lib/api';
import type { ReactionType, ReactionSummary } from './reaction.service';

export type { ReactionType, ReactionSummary };

type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  data: T;
};

export async function reactToPost(
  postId: string,
  type: ReactionType,
) {
  return apiFetch<ApiEnvelope<unknown>>(
    `/entity-posts/${postId}/reactions`,
    {
      method: 'POST',
      body: JSON.stringify({ type }),
    },
  );
}

export async function unreactToPost(postId: string) {
  return apiFetch<ApiEnvelope<unknown>>(
    `/entity-posts/${postId}/reactions`,
    { method: 'DELETE' },
  );
}

export async function getPostReactionSummary(
  postId: string,
) {
  return apiFetch<ApiEnvelope<ReactionSummary>>(
    `/entity-posts/${postId}/reactions/summary`,
  );
}