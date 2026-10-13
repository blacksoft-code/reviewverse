'use client';

import ReactionBar from '@/components/reactions/ReactionBar';
import {
  getReactionSummary,
  getReviewReactors,
  reactToReview,
  unreactToReview,
} from '@/services/reaction.service';

// Review-এর reaction — UI/লজিক সব ReactionBar-এ (post/share-এর সাথে এক)
export default function ReactionButton({
  reviewId,
}: {
  reviewId: string;
}) {
  return (
    <ReactionBar
      targetId={reviewId}
      adapter={{
        getSummary: () => getReactionSummary(reviewId),
        react: (type) => reactToReview(reviewId, type),
        unreact: () => unreactToReview(reviewId),
        getReactors: () => getReviewReactors(reviewId),
      }}
    />
  );
}
