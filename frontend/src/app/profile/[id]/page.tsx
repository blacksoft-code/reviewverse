'use client';

import {
  useEffect,
  useState,
} from 'react';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { getUserProfile } from '@/services/user.service';

import ProfileActions from '@/components/profile/ProfileActions';

import SingleImageUploader from '@/components/media/SingleImageUploader';

import { useAuth } from '@/context/AuthContext';
import ReactionButton from '@/components/reviews/ReactionButton';
import CommentSection from '@/components/reviews/CommentSection';

type ProfileMedia = {
  id: string;
  url: string;
  type: string;
};

type ProfileUser = {
  id: string;
  name: string;
  createdAt: string;

  media?: ProfileMedia[];

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

  const { user: currentUser, loading: authLoading } =
    useAuth();

  const [profile, setProfile] =
    useState<ProfileUser | null>(null);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState('');

  // ─────────────────────────────
  // Profile media state
  // ─────────────────────────────

  const [avatarUrl, setAvatarUrl] =
    useState<string | null>(null);

  const [coverPhotoUrl, setCoverPhotoUrl] =
    useState<string | null>(null);

  const [openCommentsFor, setOpenCommentsFor] = useState<string | null>(null);
  // ─────────────────────────────
  // Is this my own profile?
  // ─────────────────────────────

  const isOwnProfile =
    currentUser?.id === profileId;

  // ─────────────────────────────
  // Load profile
  // ─────────────────────────────

  useEffect(() => {
    if (authLoading) {
      return;
    }

    async function loadProfile() {
      try {
        setLoading(true);
        setError('');

        const response =
          await getUserProfile(profileId);

        const profileData =
          response.data as ProfileUser;

        setProfile(profileData);

        // ─────────────────────────────
        // Get profile photo from Media
        // ─────────────────────────────

        const profileMedia =
          profileData.media?.find(
            (media) =>
              media.type === 'USER_PROFILE',
          );

        // ─────────────────────────────
        // Get cover photo from Media
        // ─────────────────────────────

        const coverMedia =
          profileData.media?.find(
            (media) =>
              media.type === 'USER_COVER',
          );

        setAvatarUrl(
          profileMedia?.url ?? null,
        );

        setCoverPhotoUrl(
          coverMedia?.url ?? null,
        );
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
  }, [profileId, authLoading]);

  // ─────────────────────────────
  // Loading
  // ─────────────────────────────

  if (authLoading || loading) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-gray-500">
            Loading profile...
          </p>
        </div>
      </main>
    );
  }

  // ─────────────────────────────
  // Error / Profile not found
  // ─────────────────────────────

  if (!profile) {
    return (
      <main className="min-h-screen bg-gray-50 px-4 py-8">
        <div className="mx-auto max-w-5xl">
          <div className="rounded-xl bg-white p-6 text-red-600 shadow-sm">
            {error || 'Profile not found.'}
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">

        {/* ================================================= */}
        {/* PROFILE HEADER */}
        {/* ================================================= */}

        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">

          {/* ───────────────────────────── */}
          {/* Cover Photo */}
          {/* ───────────────────────────── */}

          <div className="relative h-48 bg-gray-200 sm:h-64">

            {coverPhotoUrl ? (
              <img
                src={coverPhotoUrl}
                alt={`${profile.name}'s cover`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                Cover Photo
              </div>
            )}

            {/* ───────────────────────────── */}
            {/* Own Profile → Cover Uploader */}
            {/* ───────────────────────────── */}

            {isOwnProfile && (
              <div className="absolute right-4 top-4">
                <SingleImageUploader
                  type="USER_COVER"
                  targetId={profile.id}
                  currentUrl={coverPhotoUrl}
                  variant="overlay"
                  label="Change cover photo"
                  onUploaded={(url) => {
                    setCoverPhotoUrl(url);
                  }}
                />
              </div>
            )}

          </div>

          <div className="px-6 pb-6">

            {/* ───────────────────────────── */}
            {/* Avatar */}
            {/* ───────────────────────────── */}

            <div className="-mt-16">

              <div className="relative h-32 w-32">

                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={profile.name}
                    className="h-32 w-32 rounded-full border-4 border-white object-cover shadow"
                  />
                ) : (
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-gray-200 text-3xl font-bold text-gray-500 shadow">
                    {profile.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>
                )}

                {/* ───────────────────────────── */}
                {/* Own Profile → Avatar Uploader */}
                {/* ───────────────────────────── */}

                {isOwnProfile && (
                  <div className="absolute -bottom-2 -right-2">
                    <SingleImageUploader
                      type="USER_PROFILE"
                      targetId={profile.id}
                      currentUrl={avatarUrl}
                      shape="circle"
                      variant="overlay"
                      label="Change profile photo"
                      onUploaded={(url) => {
                        setAvatarUrl(url);
                      }}
                    />
                  </div>
                )}

              </div>

            </div>

            {/* ───────────────────────────── */}
            {/* User Information */}
            {/* ───────────────────────────── */}

            <div className="mt-4">

              <h1 className="text-3xl font-bold text-gray-900">
                {profile.name}
              </h1>

              <p className="mt-1 text-gray-500">
                {profile.reviewCount} reviews
              </p>

              <ProfileActions userId={profile.id} userName={profile.name} />

            </div>

            {/* ───────────────────────────── */}
            {/* Profile Navigation */}
            {/* ───────────────────────────── */}

            <nav className="mt-8 border-t pt-4">

              <div className="flex flex-wrap gap-6 text-sm font-medium">

                <Link
                  href={`/profile/${profile.id}`}
                  className="text-black"
                >
                  Reviews
                </Link>

                <Link
                  href={`/profile/${profile.id}/about`}
                  className="text-gray-500 hover:text-black"
                >
                  About
                </Link>

                <Link
                  href={`/profile/${profile.id}/friends`}
                  className="text-gray-500 hover:text-black"
                >
                  Friends
                </Link>

                <Link
                  href={`/profile/${profile.id}/photos`}
                  className="text-gray-500 hover:text-black"
                >
                  Photos
                </Link>

              </div>

            </nav>

          </div>
        </section>

        {/* ================================================= */}
        {/* REVIEWS */}
        {/* ================================================= */}

        <section className="mt-6">

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

                  {/* ───────────────────────────── */}
                  {/* Review Header */}
                  {/* ───────────────────────────── */}

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

                  {/* ───────────────────────────── */}
                  {/* Rating */}
                  {/* ───────────────────────────── */}

                  <div className="mt-3 text-sm">
                    <span>
                      {'⭐'.repeat(review.rating)}
                    </span>
                  </div>

                  {/* ───────────────────────────── */}
                  {/* Review Content */}
                  {/* ───────────────────────────── */}

                  <p className="mt-4 whitespace-pre-wrap text-gray-700">
                    {review.content}
                  </p>

                  {/* ───────────────────────────── */}
                  {/* Review Actions */}
                  {/* ───────────────────────────── */}

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

      </div>
    </main>
  );
}