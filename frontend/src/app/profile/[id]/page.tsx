'use client';

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

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError('');
        const response = await getUserProfile(profileId);
        setProfile(response.data as ProfileUser);
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

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900">
        Reviews
      </h2>

      <div className="mt-4 space-y-5">
        {profile.reviews.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-gray-500 shadow-sm">
            No reviews yet.
          </div>
        ) : (
          profile.reviews.map((review) => (
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

                <button
                  type="button"
                  className="font-medium text-gray-500 hover:underline"
                >
                  ↗ Share
                </button>
              </div>

              {openCommentsFor === review.id && (
                <CommentSection reviewId={review.id} />
              )}
            </article>
          ))
        )}
      </div>
    </section>
  );
}