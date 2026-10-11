'use client';

import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';
import PhotoGrid from '@/components/media/PhotoGrid';
import { deleteShare, ShareItem } from '@/services/share.service';

import ShareButton from './ShareButton';
import ShareReactionButton from './ShareReactionButton';
import ShareCommentSection from './ShareCommentSection';

// একজন user অন্যের review/post share করলে feed ও profile-এ এই card দেখায়।
// Reaction/comment এখানে এই share-এর নিজস্ব — মূল review/post-এর না।
export default function SharedCard({
  share,
  onDeleted,
}: {
  share: ShareItem;
  onDeleted?: (shareId: string) => void;
}) {
  const { user } = useAuth();

  const isMine = user?.id === share.userId;
  const { review, post } = share;

  async function handleDelete() {
    if (!confirm('Delete this share?')) return;

    try {
      await deleteShare(share.id);
      onDeleted?.(share.id);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Failed to delete',
      );
    }
  }

  return (
    <div className="rounded-lg border p-5">
      {/* Sharer */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
          {share.user.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <Link
              href={`/profile/${encodeURIComponent(share.userId)}`}
              className="font-medium hover:underline"
            >
              {share.user.name}
            </Link>{' '}
            <span className="text-gray-500">
              shared {review ? 'a review' : 'a post'}
            </span>
          </p>

          <Link
            href={`/shares/${share.id}`}
            className="text-xs text-gray-400 hover:underline"
          >
            {new Date(share.createdAt).toLocaleDateString()}
          </Link>
        </div>

        {isMine && (
          <button
            type="button"
            onClick={handleDelete}
            className="text-xs font-medium text-red-500 hover:underline"
          >
            Delete
          </button>
        )}
      </div>

      {share.caption && (
        <p className="mt-3 whitespace-pre-wrap text-sm">
          {share.caption}
        </p>
      )}

      {/* Original review / post */}
      <div className="mt-3 rounded-lg border p-4">
        {review && (
          <>
            <div className="flex items-center justify-between">
              <Link
                href={`/profile/${encodeURIComponent(review.userId)}`}
                className="text-sm font-medium hover:underline"
              >
                {review.user.name}
              </Link>
              <p className="text-sm">⭐ {review.rating}</p>
            </div>

            <Link
              href={`/entities/${encodeURIComponent(review.entity.slug)}`}
              className="mt-1 block text-sm text-gray-500 hover:underline"
            >
              {review.entity.name}
            </Link>

            <p className="mt-2 whitespace-pre-wrap text-sm">
              {review.content}
            </p>

            {review.media.length > 0 && (
              <PhotoGrid photos={review.media} />
            )}
          </>
        )}

        {post && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                {post.entity.logo ? (
                  <img
                    src={post.entity.logo}
                    alt={post.entity.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-gray-500">
                    {post.entity.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <Link
                href={`/entities/${encodeURIComponent(post.entity.slug)}`}
                className="text-sm font-medium hover:underline"
              >
                {post.entity.name}
              </Link>

              <span className="ml-auto text-xs text-gray-400">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>

            <p className="mt-2 whitespace-pre-wrap text-sm">
              {post.content}
            </p>

            {post.media.length > 0 && (
              <PhotoGrid photos={post.media} />
            )}
          </>
        )}
      </div>

      {/* Engagement — শুধু এই share-এর; ShareButton মূল review/post-কে
          share করে এবং মূলটার মোট share count দেখায় */}
      <div className="mt-4 border-t pt-3">
        <ShareReactionButton shareId={share.id} />

        <ShareButton
          reviewId={review?.id}
          entityPostId={post?.id}
        />

        <ShareCommentSection shareId={share.id} />
      </div>
    </div>
  );
}
