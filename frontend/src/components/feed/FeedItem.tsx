'use client';

import { useState } from 'react';
import Link from 'next/link';

import type { FeedReview } from '@/services/feed.service';
import PhotoGrid from '@/components/media/PhotoGrid';
import ReactionButton from '@/components/reviews/ReactionButton';
import CommentSection from '@/components/reviews/CommentSection';

export default function FeedItem({
  review,
}: {
  review: FeedReview;
}) {
  const [showComments, setShowComments] =
    useState(false);

  return (
    <div className="rounded-lg border p-5">
      <div className="flex items-center justify-between">
        <Link
          href={`/profile/${encodeURIComponent(
            review.userId,
          )}`}
          className="font-medium hover:underline"
        >
          {review.user.name}
        </Link>
        <p>⭐ {review.rating}</p>
      </div>

      <Link
        href={`/entities/${encodeURIComponent(
          review.entity.slug,
        )}`}
        className="mt-1 block text-sm text-gray-500 hover:underline"
      >
        {review.entity.name}
      </Link>

      <p className="mt-3 text-sm">
        {review.content}
      </p>

      {review.media && review.media.length > 0 && (
        <PhotoGrid photos={review.media} />
      )}

      {/* NEW — Reactions + Comments */}
      <div className="mt-4 flex items-center gap-6 border-t pt-3">
        <ReactionButton reviewId={review.id} />

        <button
          type="button"
          onClick={() =>
            setShowComments((prev) => !prev)
          }
          className="text-sm font-medium text-gray-500 hover:underline"
        >
          💬 Comments
        </button>
      </div>

      {showComments && (
        <CommentSection reviewId={review.id} />
      )}
    </div>
  );
}