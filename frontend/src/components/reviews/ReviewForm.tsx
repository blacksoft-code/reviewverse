'use client';

import { FormEvent, useState } from 'react';
import { createReview } from '@/services/review.service';

type Review = {
  id: string;
  rating: number;
  content: string;
  userId: string;
  entityId: string;
  createdAt: string;
};

type ReviewFormProps = {
  entityId: string;
  onReviewCreated: (review: Review) => void;
};

export default function ReviewForm({
  entityId,
  onReviewCreated,
}: ReviewFormProps) {
  const [rating, setRating] = useState(5);
  const [content, setContent] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await createReview({
        rating,
        content,
        entityId,
      });

      // Send newly created review to ReviewSection
      onReviewCreated(response.data);

      setContent('');
      setRating(5);

      setSuccess(
        'Review submitted successfully!',
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to submit review',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-10">
      <h2 className="text-2xl font-semibold">
        Write a Review
      </h2>

      <form
        onSubmit={handleSubmit}
        className="mt-6 space-y-5"
      >
        <div>
          <label className="block text-sm font-medium">
            Rating
          </label>

          <select
            value={rating}
            onChange={(event) =>
              setRating(Number(event.target.value))
            }
            className="mt-1 rounded-lg border p-3"
          >
            <option value={5}>⭐⭐⭐⭐⭐ — 5</option>
            <option value={4}>⭐⭐⭐⭐ — 4</option>
            <option value={3}>⭐⭐⭐ — 3</option>
            <option value={2}>⭐⭐ — 2</option>
            <option value={1}>⭐ — 1</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium">
            Your Review
          </label>

          <textarea
            value={content}
            onChange={(event) =>
              setContent(event.target.value)
            }
            required
            rows={5}
            className="mt-1 w-full rounded-lg border p-3"
            placeholder="Share your experience..."
          />
        </div>

        {error && (
          <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
            {success}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading
            ? 'Submitting...'
            : 'Submit Review'}
        </button>
      </form>
    </section>
  );
}