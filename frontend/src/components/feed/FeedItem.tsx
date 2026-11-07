'use client';

import { useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import ReviewCard from '@/components/reviews/ReviewCard';
import type { FeedReview } from '@/services/feed.service';
import type { Review } from '@/services/review.service';

// Feed-এর review — entity page আর profile-এর মতো একই ReviewCard
// (⋮ Edit/Delete, reaction, share, comments সব এক জায়গার code)
export default function FeedItem({
  review: initialReview,
}: {
  review: FeedReview;
}) {
  const { user } = useAuth();

  const [review, setReview] = useState<FeedReview>(initialReview);
  const [deleted, setDeleted] = useState(false);

  if (deleted) return null;

  // Feed-এর review shape-কে ReviewCard-এর Review shape-এ মেলানো
  const asReview: Review = {
    ...review,
    offeringId: review.offeringId ?? null,
    isLatest: review.isLatest ?? true,
    offering: review.offering ?? undefined,
  } as Review;

  return (
    <ReviewCard
      review={asReview}
      olderReviews={[]}
      variant="feed"
      currentUserId={user?.id}
      entityId={review.entityId}
      onUpdated={(updated) =>
        setReview((current) => ({
          ...current,
          rating: updated.rating,
          content: updated.content,
          updatedAt: updated.updatedAt,
        }))
      }
      onDeleted={() => setDeleted(true)}
    />
  );
}
