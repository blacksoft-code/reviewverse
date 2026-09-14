import { apiFetch } from '@/lib/api';
import type {
  CommentAuthor,
  ReviewCommentReply,
} from './comment.service';

export type PostCommentReply = Omit<
  ReviewCommentReply,
  'reviewId'
> & { postId: string };

export type PostCommentThread = PostCommentReply & {
  replies: PostCommentReply[];
};

export type PostCommentsResponse = {
  comments: PostCommentThread[];
  totalCount: number;
};

export type { CommentAuthor };

type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  data: T;
};

export async function getPostComments(postId: string) {
  return apiFetch<ApiEnvelope<PostCommentsResponse>>(
    `/entity-posts/${postId}/comments`,
  );
}

export async function createPostComment(
  postId: string,
  content: string,
  parentId?: string,
) {
  return apiFetch<ApiEnvelope<PostCommentReply>>(
    `/entity-posts/${postId}/comments`,
    {
      method: 'POST',
      body: JSON.stringify({ content, parentId }),
    },
  );
}

export async function deletePostComment(
  commentId: string,
) {
  return apiFetch<ApiEnvelope<{ message: string }>>(
    `/post-comments/${commentId}`,
    { method: 'DELETE' },
  );
}