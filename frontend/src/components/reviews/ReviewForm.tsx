'use client';

import {
  FormEvent,
  useEffect,
  useState,
} from 'react';

import { createReview } from '@/services/review.service';
import { getProfile } from '@/services/auth.service';

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

  // NEW:
  // User login করা আছে কি না সেটা track করবে।
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // NEW:
  // Profile check করার সময় loading state দেখানোর জন্য।
  const [checkingAuth, setCheckingAuth] = useState(true);

  // NEW:
  // Component load হওয়ার পর current user-এর authentication
  // status check করা হচ্ছে।
  useEffect(() => {
    async function checkAuth() {
      try {
        // Backend-এর /auth/profile endpoint call করবে।
        // Valid JWT থাকলে request successful হবে।
        await getProfile();

        // Profile পাওয়া গেলে user logged in।
        setIsLoggedIn(true);
      } catch {
        // Profile request fail করলে user logged out
        // অথবা token invalid/expired ধরে নিচ্ছি।
        setIsLoggedIn(false);
      } finally {
        // Authentication check শেষ।
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, []);

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
      // যাতে refresh ছাড়াই review UI-তে দেখানো যায়।
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

  // NEW:
  // Profile check শেষ না হওয়া পর্যন্ত form দেখাব না।
  // এতে authentication status determine হওয়ার আগে
  // হঠাৎ করে form দেখানোর সমস্যা হবে না।
  if (checkingAuth) {
    return (
      <section className="mt-10">
        <p className="text-gray-500">
          Checking authentication...
        </p>
      </section>
    );
  }

  // NEW:
  // User logged in না থাকলে review form দেখানো হবে না।
  // পরিবর্তে login করার message দেখানো হবে।
  if (!isLoggedIn) {
    return (
      <section className="mt-10 rounded-lg border p-5">
        <h2 className="text-xl font-semibold">
          Want to write a review?
        </h2>

        <p className="mt-2 text-gray-600">
          Please login to share your experience.
        </p>

        <a
          href="/login"
          className="mt-4 inline-block rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
        >
          Login
        </a>
      </section>
    );
  }

  // User logged in থাকলে নিচের actual review form render হবে।
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