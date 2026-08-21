'use client';

import { useEffect, useState } from 'react';
import ReviewForm from './ReviewForm';
import { getProfile } from '@/services/auth.service';
import {
  updateReview,
  deleteReview,
  Review,
} from '@/services/review.service';

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

  const averageRating =
  reviews.length > 0
    ? reviews.reduce(
        (sum, review) => sum + review.rating,
        0,
      ) / reviews.length
    : 0;

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
    ...currentReviews,
  ]);
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
    await deleteReview(reviewId);

    setReviews((currentReviews) =>
      currentReviews.filter(
        (review) => review.id !== reviewId,
      ),
    );
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
          reviews.map((review) => {
            const isOwner =
              currentUser?.id === review.userId;

            const isEditing =
              editingReviewId === review.id;

            const isLoading =
              loadingReviewId === review.id;

            return (
              <article
                key={review.id}
                className="rounded-lg border p-5"
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

                    <p className="mt-3">
                      {review.content}
                    </p>

                    {isOwner && (
                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            startEditing(review)
                          }
                          className="rounded-lg border px-4 py-2 text-sm"
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          disabled={isLoading}
                          onClick={() =>
                            handleDelete(review.id)
                          }
                          className="rounded-lg border border-red-300 px-4 py-2 text-sm text-red-600 disabled:opacity-50"
                        >
                          {isLoading
                            ? 'Deleting...'
                            : 'Delete'}
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

      <ReviewForm
        entityId={entityId}
        onReviewCreated={handleReviewCreated}
      />
    </section>
  );
}