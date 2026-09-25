'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ReviewForm from './ReviewForm';
import { getProfile } from '@/services/auth.service';
import {
  updateReview,
  deleteReview,
  Review,
} from '@/services/review.service';
import PhotoGrid from '@/components/media/PhotoGrid';
import ReactionButton from '@/components/reviews/ReactionButton';
import CommentSection from '@/components/reviews/CommentSection';

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

  const [editingReviewId, setEditingReviewId] =
    useState<string | null>(null);

  const [editingRating, setEditingRating] =
    useState(5);

  const [editingContent, setEditingContent] =
    useState('');

  const [loadingReviewId, setLoadingReviewId] =
    useState<string | null>(null);

  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);

  // কোন (userId + offeringId) group-এর পুরনো review গুলো "more..." দিয়ে
  // খোলা আছে, সেটা track করার জন্য
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(),
  );

  function groupKey(userId: string, offeringId: string | null) {
    return `${userId}::${offeringId ?? 'general'}`;
  }

  function toggleGroup(key: string) {
    setExpandedGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }
  
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const targetReviewId = searchParams.get('reviewId');

    if (!targetReviewId) return;
    if (!reviews.some((r) => r.id === targetReviewId)) return;

    // Facebook-এর মতো — notification থেকে এলে সরাসরি ঐ review-তে স্ক্রল
    // করে তার comment section খুলে দেওয়া হচ্ছে
    setOpenCommentsFor(targetReviewId);

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

  function startEditing(review: Review) {
    setEditingReviewId(review.id);
    setEditingRating(review.rating);
    setEditingContent(review.content);
  }

  function cancelEditing() {
    setEditingReviewId(null);
    setEditingRating(5);
    setEditingContent('');
  }

async function handleUpdate(reviewId: string) {
  setLoadingReviewId(reviewId);

  try {
    const response = await updateReview(reviewId, {
      rating: editingRating,
      content: editingContent,
    });

    const updatedReview = response.data;

    setReviews((currentReviews) =>
      currentReviews.map((review) =>
        review.id === reviewId
          ? {
              ...review,
              ...updatedReview,
              user: review.user,
            }
          : review,
      ),
    );

    cancelEditing();
    router.refresh();
  } catch (error) {
    console.error(error);
  } finally {
    setLoadingReviewId(null);
  }
}
  

 async function handleDelete(reviewId: string) {
  const confirmed = window.confirm(
    'Are you sure you want to delete this review?',
  );

  if (!confirmed) {
    return;
  }

  setLoadingReviewId(reviewId);

  try {
    const response = await deleteReview(reviewId);

    setReviews((currentReviews) => {
      const withoutDeleted = currentReviews.filter(
        (review) => review.id !== reviewId,
      );

      // Backend delete হওয়া review-টাই "latest" ছিলো এবং এই user-এর
      // এই item-এ আরও পুরনো review ছিলো — সেটাকে আবার isLatest=true
      // করে দিয়েছে। local state-এও সেটা reflect করছি, নাহলে সেই
      // group পুরো list থেকে refresh না করা পর্যন্ত উধাও থাকতো।
      if (response.promotedReview) {
        return withoutDeleted.map((review) =>
          review.id === response.promotedReview.id
            ? { ...review, isLatest: true }
            : review,
        );
      }

      return withoutDeleted;
    });

    router.refresh();
  } catch (error) {
    console.error(error);
  } finally {
    setLoadingReviewId(null);
  }
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
          reviews
            // এই section-এ প্রতি (user, offering) group-এর শুধু latest
            // review-টাই একটা top-level card হিসেবে দেখানো হয়; পুরনোগুলো
            // ঐ card-এর ভেতরেই "more..."-এর নিচে যায় (নিচে দেখুন)।
            .filter((review) => review.isLatest)
            .map((review) => {
            const isOwner =
              currentUser?.id === review.userId;

            const isEditing =
              editingReviewId === review.id;

            const isLoading =
              loadingReviewId === review.id;

            const key = groupKey(
              review.userId,
              review.offeringId,
            );

            const olderReviews = reviews
              .filter(
                (r) =>
                  !r.isLatest &&
                  r.userId === review.userId &&
                  r.offeringId === review.offeringId,
              )
              .sort(
                (a, b) =>
                  new Date(b.createdAt).getTime() -
                  new Date(a.createdAt).getTime(),
              );

            const isExpanded = expandedGroups.has(key);

            return (
              <article
                key={review.id}
                id={`review-${review.id}`}
                className="rounded-lg border p-5 transition-shadow"
              >
                {isEditing ? (
                  <>
                    <select
                      value={editingRating}
                      onChange={(event) =>
                        setEditingRating(
                          Number(event.target.value),
                        )
                      }
                      className="rounded-lg border p-3"
                    >
                      <option value={5}>
                        ⭐⭐⭐⭐⭐ — 5
                      </option>

                      <option value={4}>
                        ⭐⭐⭐⭐ — 4
                      </option>

                      <option value={3}>
                        ⭐⭐⭐ — 3
                      </option>

                      <option value={2}>
                        ⭐⭐ — 2
                      </option>

                      <option value={1}>
                        ⭐ — 1
                      </option>
                    </select>

                    <textarea
                      value={editingContent}
                      onChange={(event) =>
                        setEditingContent(
                          event.target.value,
                        )
                      }
                      rows={4}
                      className="mt-3 w-full rounded-lg border p-3"
                    />

                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={() =>
                          handleUpdate(review.id)
                        }
                        className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
                      >
                        {isLoading
                          ? 'Saving...'
                          : 'Save'}
                      </button>

                      <button
                        type="button"
                        disabled={isLoading}
                        onClick={cancelEditing}
                        className="rounded-lg border px-4 py-2"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between">
                      <strong>
                        {review.user?.name ?? 'User'}
                      </strong>

                      <span>
                        ⭐ {review.rating}
                      </span>
                    </div>

                    {review.offering && (
                      <span className="mt-1 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                        {review.offering.name}
                      </span>
                    )}

                    <p className="mt-3">
                      {review.content}
                    </p>
                    {review.media && review.media.length > 0 && (
                      <PhotoGrid photos={review.media} />
                    )}

                    <div className="mt-4 flex items-center gap-6 border-t pt-3">
                      <ReactionButton reviewId={review.id} />

                      <button
                        type="button"
                        onClick={() =>
                          setOpenCommentsFor((prev) =>
                            prev === review.id ? null : review.id,
                          )
                        }
                        className="text-sm font-medium text-gray-500 hover:underline"
                      >
                        💬 Comments
                      </button>

                      {olderReviews.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleGroup(key)}
                          className="text-sm font-medium text-gray-500 hover:underline"
                        >
                          {isExpanded
                            ? 'Hide older reviews'
                            : `more... (${olderReviews.length})`}
                        </button>
                      )}
                    </div>

                    {openCommentsFor === review.id && (
                      <CommentSection reviewId={review.id} />
                    )}

                    {isExpanded && olderReviews.length > 0 && (
                      <div className="mt-4 space-y-3 border-t pt-3">
                        {olderReviews.map((old) => (
                          <div
                            key={old.id}
                            className="rounded-lg bg-gray-50 p-3"
                          >
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-medium text-gray-400">
                                পুরনো — এখন গণনায় নেই
                              </span>

                              <span className="text-sm">
                                ⭐ {old.rating}
                              </span>
                            </div>

                            <p className="mt-2 text-sm text-gray-600">
                              {old.content}
                            </p>

                            <p className="mt-1 text-xs text-gray-400">
                              {new Date(
                                old.createdAt,
                              ).toLocaleDateString()}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}

                    {isOwner && (
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditing(review)}
                          className="rounded-lg border px-4 py-2 text-sm"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() => handleDelete(review.id)}
                          className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 disabled:opacity-50"
                        >
                          {isLoading ? 'Deleting...' : 'Delete'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </article>
            );
          })
        )}
      </div>
{/* ==================Review Form===================== */}
      {/*
      <ReviewForm
        entityId={entityId}
        onReviewCreated={handleReviewCreated}
      />
      */}
    </section>
  );
}