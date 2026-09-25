'use client';

import {
  FormEvent,
  useEffect,
  useState,
} from 'react';

import {
  createReview,
  Review,
} from '@/services/review.service';
import { getProfile } from '@/services/auth.service';
import { uploadImages } from '@/services/media.service';
import {
  getOfferingsByEntity,
  Offering,
} from '@/services/offering.service';

import MultiImageUploader from '@/components/media/MultiImageUploader';

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
  const [photos, setPhotos] = useState<File[]>([]);
  const [offeringId, setOfferingId] = useState('');
  const [offerings, setOfferings] = useState<Offering[]>([]);

  const [loading, setLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] =
    useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [checkingAuth, setCheckingAuth] =
    useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        await getProfile();
        setIsLoggedIn(true);
      } catch {
        setIsLoggedIn(false);
      } finally {
        setCheckingAuth(false);
      }
    }

    checkAuth();
  }, []);

  useEffect(() => {
    async function loadOfferings() {
      try {
        const response = await getOfferingsByEntity(entityId);
        setOfferings(response.data);
      } catch {
        // offering list load না হলেও review দেওয়া আটকাবে না —
        // dropdown-টা শুধু খালি/optional থেকে যাবে
        setOfferings([]);
      }
    }

    loadOfferings();
  }, [entityId]);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // ১. আগে review টেক্সট তৈরি হবে (id পাওয়ার জন্য)
      const response = await createReview({
        rating,
        content,
        entityId,
        offeringId: offeringId || undefined,
      });

      let review = response.data;

      // ২. review তৈরি হয়ে গেলে, ছবি থাকলে সেগুলো upload
      // হবে review.id-কে targetId হিসেবে ব্যবহার করে
      if (photos.length > 0) {
        setUploadingPhotos(true);

        try {
          const media = await uploadImages(
            photos,
            'REVIEW',
            review.id,
          );

          // Media array-টা review object-এ বসিয়ে দেওয়া হলো,
          // যাতে refresh ছাড়াই ছবিসহ review দেখা যায়
          review = { ...review, media };
        } catch (uploadErr) {
          // Review টেক্সট সফলভাবে তৈরি হয়েছে, শুধু ছবি
          // upload ব্যর্থ হয়েছে — সেটা আলাদাভাবে জানানো হচ্ছে
          setError(
            uploadErr instanceof Error
              ? `Review submitted, but photo upload failed: ${uploadErr.message}`
              : 'Review submitted, but photo upload failed.',
          );
        } finally {
          setUploadingPhotos(false);
        }
      }

      onReviewCreated(review);

      setContent('');
      setRating(5);
      setPhotos([]);
      setOfferingId('');

      if (!error) {
        setSuccess(
          'Review submitted successfully!',
        );
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit review',
      );
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <section className="mt-10">
        <p className="text-gray-500">
          Checking authentication...
        </p>
      </section>
    );
  }

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

        {offerings.length > 0 && (
          <div>
            <label className="block text-sm font-medium">
              কোন item try করেছো? (ঐচ্ছিক)
            </label>

            <select
              value={offeringId}
              onChange={(event) =>
                setOfferingId(event.target.value)
              }
              className="mt-1 rounded-lg border p-3"
            >
              <option value="">
                — নির্দিষ্ট item বলছি না —
              </option>
              {offerings.map((offering) => (
                <option key={offering.id} value={offering.id}>
                  {offering.name}
                </option>
              ))}
            </select>
          </div>
        )}

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

        <div>
          <label className="block text-sm font-medium">
            Photos (optional, up to 10)
          </label>

          <MultiImageUploader
            maxFiles={10}
            onChange={setPhotos}
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
          disabled={loading || uploadingPhotos}
          className="rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
        >
          {loading
            ? 'Submitting...'
            : uploadingPhotos
              ? 'Uploading photos...'
              : 'Submit Review'}
        </button>
      </form>
    </section>
  );
}