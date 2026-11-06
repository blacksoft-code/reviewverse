'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReviewForm from './ReviewForm';
import { getProfile } from '@/services/auth.service';
import { Review } from '@/services/review.service';
import ReviewCard from '@/components/reviews/ReviewCard';
import {
  groupReviews,
  removeReview,
} from '@/components/reviews/review-groups';
import { useBlocks } from '@/hooks/useBlocks';

type ReviewSectionProps = {
  entityId: string;
  initialReviews: Review[];
  initialAverageRating: number;
};

export default function ReviewSection({
  entityId,
  initialReviews,
  initialAverageRating,
}: ReviewSectionProps) {
  const [reviews, setReviews] =
    useState<Review[]>(initialReviews);

  // Block থাকলে (দুই দিকেই) ওই user-দের review এই page-এ দেখানো হবে না
  const { hiddenUserIds } = useBlocks();

  useEffect(() => {
    if (hiddenUserIds.size === 0) return;

    setReviews((current) =>
      current.filter((r) => !hiddenUserIds.has(r.userId)),
    );
  }, [hiddenUserIds]);

  // ⚠️ static prop না রেখে reviews state থেকেই derive করা হচ্ছে (backend-এর
  // same logic: প্রতি user-এর personal average, তারপর সব user মিলিয়ে গড়) —
  // তাই create/update/delete যেকোনো কিছুর পরেই এটা automatically
  // recalculate হবে, আলাদা করে fetch বা manual update লাগবে না।
  const averageRating = useMemo(() => {
    const latestReviews = reviews.filter(
      (review) => review.isLatest,
    );

    const perUserTotals = new Map<
      string,
      { sum: number; count: number }
    >();

    for (const review of latestReviews) {
      const existing = perUserTotals.get(review.userId) ?? {
        sum: 0,
        count: 0,
      };
      existing.sum += review.rating;
      existing.count += 1;
      perUserTotals.set(review.userId, existing);
    }

    const personalAverages = Array.from(
      perUserTotals.values(),
    ).map(({ sum, count }) => sum / count);

    if (personalAverages.length === 0) {
      return 0;
    }

    return (
      personalAverages.reduce((sum, avg) => sum + avg, 0) /
      personalAverages.length
    );
  }, [reviews]);

  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

  const router = useRouter();
  const searchParams = useSearchParams();

  // Notification থেকে এলে ঐ review-এর comment খোলা অবস্থায় আসে
  const [autoOpenId, setAutoOpenId] = useState<string | null>(null);

  useEffect(() => {
    const targetReviewId = searchParams.get('reviewId');

    if (!targetReviewId) return;
    if (!reviews.some((r) => r.id === targetReviewId)) return;

    // Facebook-এর মতো — notification থেকে এলে সরাসরি ঐ review-তে স্ক্রল
    // করে তার comment section খুলে দেওয়া হচ্ছে
    setAutoOpenId(targetReviewId);

    const el = document.getElementById(`review-${targetReviewId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-blue-400');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-blue-400');
      }, 2000);
    }
  }, [searchParams, reviews]);
  
  useEffect(() => {
    async function loadProfile() {
      try {
        const response = await getProfile();

        setCurrentUser({
          id: response.data.id,
          name: response.data.name,
        });
      } catch {
        setCurrentUser(null);
      }
    }

    loadProfile();
  }, []);

  function handleReviewCreated(newReview: Review) {
  const reviewWithUser: Review = {
    ...newReview,
    user: currentUser
      ? {
          id: currentUser.id,
          name: currentUser.name,
        }
      : undefined,
  };

  setReviews((currentReviews) => [
    reviewWithUser,
    // একই group (user + offering)-এর আগের latest review-কে এখানেও
    // false করে দিচ্ছি, যাতে backend-এর isLatest flip-টা page refresh
    // ছাড়াই local state-এ reflect হয় (নাহলে দুইটা "latest" card দেখাবে)
    ...currentReviews.map((review) =>
      review.userId === newReview.userId &&
      review.offeringId === newReview.offeringId &&
      review.isLatest
        ? { ...review, isLatest: false }
        : review,
    ),
  ]);

  // profile header (layout.tsx) আর "Overall Rating" ব্লক (page.tsx) —
  // এই দুইটা Server Component, ReviewSection-এর local state থেকে আলাদা।
  // router.refresh() করলে ওরা server থেকে fresh entity data নিয়ে
  // re-render হবে, page reload ছাড়াই।
  router.refresh();
}

  // Edit/Delete-এর কাজ ReviewCard-এর ভেতরেই হয়; এখানে শুধু list আর
  // server component (header-এর rating) হালনাগাদ করা হয়
  function handleReviewUpdated(updated: Review) {
    setReviews((currentReviews) =>
      currentReviews.map((review) =>
        review.id === updated.id ? updated : review,
      ),
    );

    router.refresh();
  }

  function handleReviewDeleted(
    reviewId: string,
    promoted: Review | null,
  ) {
    setReviews((currentReviews) =>
      removeReview(currentReviews, reviewId, promoted),
    );

    router.refresh();
  }

  return (
    <section className="mt-10">
      <div>
        <h2 className="text-2xl font-semibold">
          Reviews
        </h2>

        <p className="mt-2 text-gray-600">
          ⭐ {averageRating.toFixed(1)}
        </p>
      </div>

      <div className="mt-6 space-y-4">
        {reviews.length === 0 ? (
          <p className="text-gray-500">
            No reviews yet.
          </p>
        ) : (
          groupReviews(reviews).map(({ latest, older }) => (
            <ReviewCard
              key={latest.id}
              review={latest}
              olderReviews={older}
              variant="entity"
              currentUserId={currentUser?.id}
              entityId={entityId}
              autoOpenComments={autoOpenId === latest.id}
              onUpdated={handleReviewUpdated}
              onDeleted={handleReviewDeleted}
            />
          ))
        )}
      </div>
    </section>
  );
}