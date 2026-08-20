'use client';

import { useEffect, useState } from 'react';
import ReviewForm from './ReviewForm';
import { getProfile } from '@/services/auth.service';

type Review = {
  id: string;
  rating: number;
  content: string;
  userId: string;
  entityId: string;
  createdAt: string;
  user?: {
    id: string;
    name: string;
  };
};

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

  const [averageRating, setAverageRating] =
    useState(initialAverageRating);

  const [currentUser, setCurrentUser] = useState<{
    id: string;
    name: string;
  } | null>(null);

  // Get logged-in user's information
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

  function handleReviewCreated(
    newReview: Review,
  ) {
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

    setAverageRating((currentAverage) => {
      const currentCount = reviews.length;

      const total =
        currentAverage * currentCount +
        newReview.rating;

      return total / (currentCount + 1);
    });
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
          reviews.map((review) => (
            <article
              key={review.id}
              className="rounded-lg border p-5"
            >
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
            </article>
          ))
        )}
      </div>

      <ReviewForm
        entityId={entityId}
        onReviewCreated={handleReviewCreated}
      />
    </section>
  );
}