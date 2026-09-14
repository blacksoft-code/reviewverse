import { apiFetch } from '@/lib/api';

export type CommentAuthor = {
  id: string;
  name: string;
};

export type ReviewCommentReply = {
  id: string;
  content: string;
  userId: string;
  reviewId: string;
  parentId: string | null;
  createdAt: string;
  user: CommentAuthor;
};

export type ReviewCommentThread = ReviewCommentReply & {
  replies: ReviewCommentReply[];
};

export type CommentsResponse = {
  comments: ReviewCommentThread[];
  totalCount: number;
};

type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  data: T;
};

export async function getComments(reviewId: string) {
  return apiFetch<ApiEnvelope<CommentsResponse>>(
    `/reviews/${reviewId}/comments`,
  );
}

export async function createComment(
  reviewId: string,
  content: string,
  parentId?: string,
) {
  return apiFetch<ApiEnvelope<ReviewCommentReply>>(
    `/reviews/${reviewId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    },
  );
}

export async function deleteComment(
  commentId: string,
) {
  return apiFetch<ApiEnvelope<{ message: string }>>(
    `/comments/${commentId}`,
    { method: 'DELETE' },
  );
}