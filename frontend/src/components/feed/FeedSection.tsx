'use client';

import { useEffect, useState } from 'react';

import { getFeed } from '@/services/feed.service';
import type { FeedReview } from '@/services/feed.service';
import FeedItem from './FeedItem';

export default function FeedSection() {
  const [reviews, setReviews] = useState<FeedReview[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    getFeed()
      .then((res) => {
        if (isMounted) setReviews(res.data);
      })
      .catch((err) => {
        if (isMounted) setError(err.message);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="mt-8">
      <h2 className="text-2xl font-semibold">
        Feed
      </h2>

      {error && (
        <p className="mt-4 text-sm text-gray-500">
          You have to login to see Feed.
        </p>
      )}

      {!error && reviews === null && (
        <p className="mt-4 text-sm text-gray-500">
          Loading...
        </p>
      )}

      {!error &&
        reviews !== null &&
        reviews.length === 0 && (
          <p className="mt-4 text-sm text-gray-500">
            No reviews yet.
          </p>
        )}

      {!error &&
        reviews !== null &&
        reviews.length > 0 && (
          <div className="mt-4 space-y-4">
            {reviews.map((review) => (
              <FeedItem
                key={review.id}
                review={review}
              />
            ))}
          </div>
        )}
    </section>
  );
}