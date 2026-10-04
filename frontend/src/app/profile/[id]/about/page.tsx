'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { getUserProfile, Gender } from '@/services/user.service';

type AboutUser = {
  id: string;
  name: string;
  reviewCount: number;
  createdAt: string;
  worksAt: string | null;
  studiesAt: string | null;
  livesIn: string | null;
  from: string | null;
  birthday: string | null;
  gender: Gender | null;
  bio: string | null;
};

const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
};

export default function AboutPage() {
  const params = useParams();
  const profileId = params.id as string;

  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === profileId;

  const [user, setUser] = useState<AboutUser | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const response = await getUserProfile(
          profileId,
        );
        setUser(response.data as AboutUser);
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

    load();
  }, [profileId]);

  if (loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  if (!user) {
    return (
      <p className="text-red-600">
        {error || 'Profile not found.'}
      </p>
    );
  }

  return (
    <div className="max-w-3xl rounded-xl bg-black p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">
          About {user.name}
        </h2>

        {isOwnProfile && (
          <Link
            href={`/profile/${profileId}/edit`}
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-800"
          >
            Edit info
          </Link>
        )}
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      <div className="mt-6 space-y-5">
        {user.bio && (
          <div>
            <p className="text-sm text-gray-500">
              About
            </p>
            <p className="mt-1 whitespace-pre-wrap font-medium">
              {user.bio}
            </p>
          </div>
        )}

        <div>
          <p className="text-sm text-gray-500">
            Name
          </p>
          <p className="mt-1 font-medium">
            {user.name}
          </p>
        </div>

        {user.worksAt && (
          <div>
            <p className="text-sm text-gray-500">
              Works at
            </p>
            <p className="mt-1 font-medium">
              {user.worksAt}
            </p>
          </div>
        )}

        {user.studiesAt && (
          <div>
            <p className="text-sm text-gray-500">
              Studies at
            </p>
            <p className="mt-1 font-medium">
              {user.studiesAt}
            </p>
          </div>
        )}

        {user.livesIn && (
          <div>
            <p className="text-sm text-gray-500">
              Lives in
            </p>
            <p className="mt-1 font-medium">
              {user.livesIn}
            </p>
          </div>
        )}

        {user.from && (
          <div>
            <p className="text-sm text-gray-500">
              From
            </p>
            <p className="mt-1 font-medium">
              {user.from}
            </p>
          </div>
        )}

        {user.birthday && (
          <div>
            <p className="text-sm text-gray-500">
              Birthday
            </p>
            <p className="mt-1 font-medium">
              {new Date(
                user.birthday,
              ).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        )}

        {user.gender && (
          <div>
            <p className="text-sm text-gray-500">
              Gender
            </p>
            <p className="mt-1 font-medium">
              {GENDER_LABELS[user.gender]}
            </p>
          </div>
        )}

        <div>
          <p className="text-sm text-gray-500">
            Reviews
          </p>
          <p className="mt-1 font-medium">
            {user.reviewCount}
          </p>
        </div>

        <div>
          <p className="text-sm text-gray-500">
            Member since
          </p>
          <p className="mt-1 font-medium">
            {new Date(
              user.createdAt,
            ).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
            })}
          </p>
        </div>
      </div>
    </div>
  );
}