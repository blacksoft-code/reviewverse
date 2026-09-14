'use client';

import { FormEvent, useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  CommentsResponse,
  ReviewCommentThread,
  createComment,
  deleteComment,
  getComments,
} from '@/services/comment.service';

const MAX_REPLIES = 20;

export default function CommentSection({
  reviewId,
}: {
  reviewId: string;
}) {
  const { user } = useAuth();

  const [data, setData] =
    useState<CommentsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [replyingTo, setReplyingTo] = useState<
    string | null
  >(null);
  const [replyText, setReplyText] = useState('');
  const [submittingReply, setSubmittingReply] =
    useState(false);

  const [expandedReplies, setExpandedReplies] =
    useState<Set<string>>(new Set());

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reviewId]);

  async function load() {
    try {
      setLoading(true);
      const res = await getComments(reviewId);
      setData(res.data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!newComment.trim()) return;

    setSubmitting(true);

    try {
      await createComment(reviewId, newComment);
      setNewComment('');
      await load();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Failed to post comment',
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleReplySubmit(parentId: string) {
    if (!replyText.trim()) return;

    setSubmittingReply(true);

    try {
      await createComment(
        reviewId,
        replyText,
        parentId,
      );
      setReplyText('');
      setReplyingTo(null);
      setExpandedReplies((prev) =>
        new Set(prev).add(parentId),
      );
      await load();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Failed to reply',
      );
    } finally {
      setSubmittingReply(false);
    }
  }

  function toggleReplies(commentId: string) {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  }

  async function handleDelete(commentId: string) {
    if (!confirm('Delete this comment?')) return;

    try {
      await deleteComment(commentId);
      await load();
    } catch (err) {
      alert(
        err instanceof Error
          ? err.message
          : 'Failed to delete',
      );
    }
  }

  if (loading) {
    return (
      <p className="mt-3 text-sm text-gray-400">
        Loading comments...
      </p>
    );
  }

  return (
    <div className="mt-4 border-t pt-4">
      {user && (
        <form
          onSubmit={handleSubmit}
          className="flex gap-2"
        >
          <input
            value={newComment}
            onChange={(e) =>
              setNewComment(e.target.value)
            }
            placeholder="Write a comment..."
            className="flex-1 rounded-full border px-4 py-2 text-sm"
          />
          <button
            type="submit"
            disabled={submitting}
            className="rounded-full bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            Post
          </button>
        </form>
      )}

      <div className="mt-4 space-y-4">
        {data?.comments.map((comment) => (
          <CommentItem
            key={comment.id}
            comment={comment}
            isExpanded={expandedReplies.has(
              comment.id,
            )}
            onToggleReplies={() =>
              toggleReplies(comment.id)
            }
            isReplying={replyingTo === comment.id}
            onStartReply={() =>
              setReplyingTo(comment.id)
            }
            onCancelReply={() => setReplyingTo(null)}
            replyText={replyText}
            onReplyTextChange={setReplyText}
            onSubmitReply={() =>
              handleReplySubmit(comment.id)
            }
            submittingReply={submittingReply}
            currentUserId={user?.id}
            onDelete={handleDelete}
          />
        ))}

        {data?.comments.length === 0 && (
          <p className="text-sm text-gray-400">
            No comments yet.
          </p>
        )}
      </div>
    </div>
  );
}

function CommentItem({
  comment,
  isExpanded,
  onToggleReplies,
  isReplying,
  onStartReply,
  onCancelReply,
  replyText,
  onReplyTextChange,
  onSubmitReply,
  submittingReply,
  currentUserId,
  onDelete,
}: {
  comment: ReviewCommentThread;
  isExpanded: boolean;
  onToggleReplies: () => void;
  isReplying: boolean;
  onStartReply: () => void;
  onCancelReply: () => void;
  replyText: string;
  onReplyTextChange: (v: string) => void;
  onSubmitReply: () => void;
  submittingReply: boolean;
  currentUserId?: string;
  onDelete: (id: string) => void;
}) {
  const replyCount = comment.replies.length;
  const atLimit = replyCount >= MAX_REPLIES;

  return (
    <div>
      <div className="flex items-start gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
          {comment.user.name.charAt(0).toUpperCase()}
        </div>

        <div className="flex-1">
          <div className="rounded-2xl bg-gray-100 px-3 py-2">
            <p className="text-sm font-medium">
              {comment.user.name}
            </p>
            <p className="text-sm">{comment.content}</p>
          </div>

          <div className="mt-1 flex gap-3 px-3 text-xs text-gray-500">
            <span>
              {new Date(
                comment.createdAt,
              ).toLocaleDateString()}
            </span>

            <button
              type="button"
              onClick={onStartReply}
              className="font-medium hover:underline"
            >
              Reply
            </button>

            {currentUserId === comment.userId && (
              <button
                type="button"
                onClick={() => onDelete(comment.id)}
                className="font-medium text-red-500 hover:underline"
              >
                Delete
              </button>
            )}
          </div>

          {isReplying && (
            <div className="mt-2 flex gap-2 px-3">
              <input
                value={replyText}
                onChange={(e) =>
                  onReplyTextChange(e.target.value)
                }
                placeholder={
                  atLimit
                    ? 'Max 20 replies reached'
                    : 'Write a reply...'
                }
                disabled={atLimit}
                className="flex-1 rounded-full border px-3 py-1.5 text-sm disabled:bg-gray-100"
              />

              <button
                type="button"
                onClick={onSubmitReply}
                disabled={submittingReply || atLimit}
                className="rounded-full bg-black px-3 py-1.5 text-xs font-medium text-white disabled:opacity-50"
              >
                Reply
              </button>

              <button
                type="button"
                onClick={onCancelReply}
                className="text-xs text-gray-500 hover:underline"
              >
                Cancel
              </button>
            </div>
          )}

          {replyCount > 0 && (
            <button
              type="button"
              onClick={onToggleReplies}
              className="mt-2 ml-3 flex items-center gap-1 text-xs font-medium text-gray-600 hover:underline"
            >
              {isExpanded ? '▲ Hide' : '▼ View'}{' '}
              {replyCount}{' '}
              {replyCount === 1 ? 'reply' : 'replies'}
            </button>
          )}

          {isExpanded && (
            <div className="mt-2 ml-6 space-y-3">
              {comment.replies.map((reply) => (
                <div
                  key={reply.id}
                  className="flex items-start gap-2"
                >
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">
                    {reply.user.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  <div className="flex-1">
                    <div className="rounded-2xl bg-gray-100 px-3 py-1.5">
                      <p className="text-xs font-medium">
                        {reply.user.name}
                      </p>
                      <p className="text-sm">
                        {reply.content}
                      </p>
                    </div>

                    <div className="mt-1 flex gap-3 px-3 text-xs text-gray-500">
                      <span>
                        {new Date(
                          reply.createdAt,
                        ).toLocaleDateString()}
                      </span>

                      {currentUserId ===
                        reply.userId && (
                        <button
                          type="button"
                          onClick={() =>
                            onDelete(reply.id)
                          }
                          className="font-medium text-red-500 hover:underline"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}