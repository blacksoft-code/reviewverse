'use client';

import ShareButton from '@/components/shares/ShareButton';
import SharedCard from '@/components/shares/SharedCard';
import { getUserShares, ShareItem } from '@/services/share.service';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { getUserProfile } from '@/services/user.service';

import ReactionButton from '@/components/reviews/ReactionButton';
import CommentSection from '@/components/reviews/CommentSection';
import PhotoGrid from '@/components/media/PhotoGrid';

type ProfileUser = {
  id: string;
  name: string;
  createdAt: string;
  reviewCount: number;
  reviews: {
    id: string;
    rating: number;
    content: string;
    createdAt: string;
    media?: { id: string; url: string }[];
    entity: {
      id: string;
      name: string;
      slug: string;
      location: string | null;
      category: {
        id: string;
        name: string;
        slug: string;
      };
    };
  }[];
};

export default function ProfilePage() {
  const params = useParams();
  const profileId = params.id as string;

  const [profile, setProfile] =
    useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCommentsFor, setOpenCommentsFor] =
    useState<string | null>(null);

  // এই user-এর share করা review/post — reviews-এর সাথে মিশিয়ে দেখানো হয়
  const [shares, setShares] = useState<ShareItem[]>([]);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError('');
        const [response, sharesRes] = await Promise.all([
          getUserProfile(profileId),
          getUserShares(profileId).catch(() => null),
        ]);
        setProfile(response.data as ProfileUser);
        setShares(sharesRes?.data ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load profile.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [profileId]);

  if (loading) {
    return <p className="text-gray-500">Loading reviews...</p>;
  }

  if (!profile) {
    return (
      <div className="rounded-xl bg-white p-6 text-red-600 shadow-sm">
        {error || 'Profile not found.'}
      </div>
    );
  }

  // Review আর share এক timeline-এ, সবচেয়ে নতুন আগে
  const timeline = [
    ...profile.reviews.map((review) => ({
      kind: 'review' as const,
      id: review.id,
      createdAt: review.createdAt,
      review,
    })),
    ...shares.map((share) => ({
      kind: 'share' as const,
      id: share.id,
      createdAt: share.createdAt,
      share,
    })),
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  );

  return (
    <section>

      <div className="mt-4 space-y-5">
        {timeline.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-gray-500 shadow-sm">
            No reviews yet.
          </div>
        ) : (
          timeline.map((item) => {
            if (item.kind === 'share') {
              return (
                <div
                  key={`share-${item.id}`}
                  className="rounded-xl bg-white p-4 text-gray-900 shadow-sm"
                >
                  <SharedCard
                    share={item.share}
                    onDeleted={(shareId) =>
                      setShares((prev) =>
                        prev.filter((s) => s.id !== shareId),
                      )
                    }
                  />
                </div>
              );
            }

            const review = item.review;

            return (
            <article
              key={review.id}
              className="rounded-xl bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Link
                    href={`/entities/${review.entity.slug}`}
                    className="text-lg font-semibold text-gray-900 hover:underline"
                  >
                    {review.entity.name}
                  </Link>

                  <p className="mt-1 text-sm text-gray-500">
                    {review.entity.category.name}
                    {review.entity.location
                      ? ` • ${review.entity.location}`
                      : ''}
                  </p>
                </div>

                <time
                  dateTime={review.createdAt}
                  className="text-sm text-gray-500"
                >
                  {new Date(
                    review.createdAt,
                  ).toLocaleDateString()}
                </time>
              </div>

              <div className="mt-3 text-sm">
                <span>{'⭐'.repeat(review.rating)}</span>
              </div>

              <p className="mt-4 whitespace-pre-wrap text-gray-700">
                {review.content}
              </p>
               {review.media && review.media.length > 0 && (
                <PhotoGrid photos={review.media} />
              )}

              <div className="mt-5 flex items-center gap-6 border-t pt-4 text-sm">
                <ReactionButton reviewId={review.id} />

                <ShareButton reviewId={review.id} />

                <button
                  type="button"
                  onClick={() =>
                    setOpenCommentsFor((prev) =>
                      prev === review.id ? null : review.id,
                    )
                  }
                  className="font-medium text-gray-500 hover:underline"
                >
                  💬 Comments
                </button>

              </div>

              {openCommentsFor === review.id && (
                <CommentSection reviewId={review.id} />
              )}
            </article>
            );
          })
        )}
      </div>
    </section>
  );
}