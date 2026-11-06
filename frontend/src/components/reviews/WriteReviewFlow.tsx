'use client';

import Link from 'next/link';
import {
  FormEvent,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { useBusinessContext } from '@/context/BusinessContext';
import { createReview } from '@/services/review.service';
import { uploadImages } from '@/services/media.service';
import {
  getOfferingsByEntity,
  Offering,
} from '@/services/offering.service';
import { SearchEntity } from '@/services/search.service';

import EntityPicker from '@/components/reviews/EntityPicker';
import MultiImageUploader from '@/components/media/MultiImageUploader';

const RATING_LABELS = [
  '',
  'Poor',
  'Fair',
  'Good',
  'Very good',
  'Excellent',
];

const cardClass =
  'rounded-2xl border border-black/5 bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)]';

const sectionTitleClass =
  'text-[13px] font-medium uppercase tracking-wide text-[#86868b]';

export default function WriteReviewFlow() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { activeBusiness } = useBusinessContext();

  const [entity, setEntity] =
    useState<SearchEntity | null>(null);

  const [offerings, setOfferings] = useState<Offering[]>(
    [],
  );
  const [offeringsLoading, setOfferingsLoading] =
    useState(false);
  const [offeringId, setOfferingId] = useState('');

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [content, setContent] = useState('');
  const [photos, setPhotos] = useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] =
    useState(false);
  const [error, setError] = useState('');

  // Photo upload fail হলেও review তৈরি হয়ে গেছে — তখন auto redirect না করে
  // user-কে জানিয়ে business page-এর link দেখানো হয়
  const [createdSlug, setCreatedSlug] = useState<
    string | null
  >(null);

  // Entity বাছলে তার public offering load হবে
  useEffect(() => {
    if (!entity) {
      setOfferings([]);
      setOfferingId('');
      return;
    }

    let cancelled = false;
    setOfferingsLoading(true);
    setOfferingId('');

    getOfferingsByEntity(entity.id)
      .then((res) => {
        if (!cancelled) setOfferings(res.data);
      })
      .catch(() => {
        // Offering load না হলেও review দেওয়া আটকাবে না
        if (!cancelled) setOfferings([]);
      })
      .finally(() => {
        if (!cancelled) setOfferingsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [entity]);

  function changeEntity() {
    setEntity(null);
    setError('');
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    if (!entity) return;

    setError('');
    setSubmitting(true);

    try {
      const response = await createReview({
        rating,
        content,
        entityId: entity.id,
        offeringId: offeringId || undefined,
      });

      const review = response.data;

      if (photos.length > 0) {
        setUploadingPhotos(true);

        try {
          await uploadImages(photos, 'REVIEW', review.id);
        } catch (uploadErr) {
          setCreatedSlug(entity.slug);
          setError(
            uploadErr instanceof Error
              ? `Review submitted, but photo upload failed: ${uploadErr.message}`
              : 'Review submitted, but photo upload failed.',
          );
          return;
        } finally {
          setUploadingPhotos(false);
        }
      }

      router.push(`/entities/${entity.slug}`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit review',
      );
    } finally {
      setSubmitting(false);
    }
  }

  // ─────────────────────────────
  // Guards
  // ─────────────────────────────
  if (authLoading) {
    return (
      <p className="py-20 text-center text-sm text-[#86868b]">
        Loading...
      </p>
    );
  }

  if (!user) {
    return (
      <div className={`${cardClass} text-center`}>
        <h2 className="text-xl font-semibold">
          Want to write a review?
        </h2>
        <p className="mt-2 text-[15px] text-[#86868b]">
          Please log in to share your experience.
        </p>
        <Link
          href="/login"
          className="mt-5 inline-block rounded-full bg-[#0071e3] px-6 py-2.5 text-[15px] font-medium text-white transition hover:bg-[#0077ed]"
        >
          Log in
        </Link>
      </div>
    );
  }

  if (activeBusiness) {
    return (
      <div className={`${cardClass} text-center`}>
        <h2 className="text-xl font-semibold">
          Switch to your personal account
        </h2>
        <p className="mt-2 text-[15px] text-[#86868b]">
          Reviews can only be written from a personal
          account, not while managing a business.
        </p>
      </div>
    );
  }

  const displayRating = hoverRating || rating;

  return (
    <div className="space-y-4">
      {/* ───────── 1. Business ───────── */}
      <section className={`${cardClass} relative z-10`}>
        <p className={sectionTitleClass}>Business</p>

        {entity ? (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-xl bg-[#f5f5f7] px-4 py-3">
            <div className="min-w-0">
              <p className="truncate text-[17px] font-semibold">
                {entity.name}
              </p>
              <p className="truncate text-sm text-[#86868b]">
                {entity.category.name}
                {entity.location
                  ? ` · ${entity.location}`
                  : ''}
              </p>
            </div>

            <button
              type="button"
              onClick={changeEntity}
              className="shrink-0 text-sm font-medium text-[#0071e3] hover:underline"
            >
              Change
            </button>
          </div>
        ) : (
          <div className="mt-3">
            <EntityPicker onSelect={setEntity} />
          </div>
        )}
      </section>

      {entity && (
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* ───────── 2. Offering (optional) ───────── */}
          {(offeringsLoading || offerings.length > 0) && (
            <section className={cardClass}>
              <p className={sectionTitleClass}>
                What did you try?{' '}
                <span className="normal-case tracking-normal">
                  (optional)
                </span>
              </p>

              {offeringsLoading ? (
                <div className="mt-3 space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-14 animate-pulse rounded-xl bg-[#f5f5f7]"
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-3 space-y-2">
                  {offerings.map((offering) => {
                    const selected =
                      offering.id === offeringId;

                    return (
                      <button
                        key={offering.id}
                        type="button"
                        onClick={() =>
                          setOfferingId(
                            selected ? '' : offering.id,
                          )
                        }
                        aria-pressed={selected}
                        className={`flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                          selected
                            ? 'border-[#0071e3] bg-[#0071e3]/5'
                            : 'border-transparent bg-[#f5f5f7] hover:bg-[#ececf0]'
                        }`}
                      >
                        {offering.media?.[0] && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={offering.media[0].url}
                            alt=""
                            className="h-10 w-10 shrink-0 rounded-lg object-cover"
                          />
                        )}

                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[15px] font-medium">
                            {offering.name}
                          </span>
                          <span className="block truncate text-xs text-[#86868b]">
                            {offering.type} · ৳
                            {offering.price}
                          </span>
                        </span>

                        <span
                          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px] text-white ${
                            selected
                              ? 'border-[#0071e3] bg-[#0071e3]'
                              : 'border-[#d2d2d7] bg-white'
                          }`}
                        >
                          {selected && '✓'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* ───────── 3. Rating + review + photos ───────── */}
          <section className={cardClass}>
            <p className={sectionTitleClass}>Rating</p>

            <div className="mt-3 flex items-center gap-3">
              <div
                className="flex gap-1"
                onMouseLeave={() => setHoverRating(0)}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() =>
                      setHoverRating(star)
                    }
                    aria-label={`${star} star${star > 1 ? 's' : ''}`}
                    className={`text-3xl leading-none transition ${
                      star <= displayRating
                        ? 'text-[#ff9f0a]'
                        : 'text-[#d2d2d7]'
                    }`}
                  >
                    ★
                  </button>
                ))}
              </div>

              <span className="text-sm text-[#86868b]">
                {RATING_LABELS[displayRating]}
              </span>
            </div>

            <p className={`${sectionTitleClass} mt-6`}>
              Your review
            </p>

            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              required
              rows={5}
              placeholder="Share your experience..."
              className="mt-3 w-full resize-none rounded-xl bg-[#f5f5f7] px-4 py-3 text-[15px] text-[#1d1d1f] outline-none placeholder:text-[#86868b] focus:ring-2 focus:ring-[#0071e3]/40"
            />

            <p className={`${sectionTitleClass} mt-6`}>
                Photos{' '}
              <span className="normal-case tracking-normal">
                (optional, up to 10)
              </span>
            </p>

            <div className="text-[#1d1d1f]">
              <MultiImageUploader
                maxFiles={10}
                onChange={setPhotos}
              />
            </div>
          </section>

          {error && (
            <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {createdSlug ? (
            <Link
              href={`/entities/${createdSlug}`}
              className="block w-full rounded-full bg-[#0071e3] py-3 text-center text-[15px] font-medium text-white transition hover:bg-[#0077ed]"
            >
              View business
            </Link>
          ) : (
            <button
              type="submit"
              disabled={submitting || uploadingPhotos}
              className="w-full rounded-full bg-[#0071e3] py-3 text-[15px] font-medium text-white transition hover:bg-[#0077ed] disabled:opacity-50"
            >
              {submitting
                ? uploadingPhotos
                  ? 'Uploading photos...'
                  : 'Submitting...'
                : 'Post review'}
            </button>
          )}
        </form>
      )}
    </div>
  );
}
