'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import SingleImageUploader from '@/components/media/SingleImageUploader';
import ProfileActions from '@/components/profile/ProfileActions';

export type ProfileHeaderData = {
  id: string;
  name: string;
  reviewCount: number;
  avatarUrl: string | null;
  coverPhotoUrl: string | null;
};

const TABS = [
  { label: 'Reviews', href: '' },
  { label: 'About', href: '/about' },
  { label: 'Friends', href: '/friends' },
  { label: 'Photos', href: '/photos' },
] as const;

export default function ProfileHeader({
  profile,
}: {
  profile: ProfileHeaderData;
}) {
  const { user: currentUser } = useAuth();
  const pathname = usePathname();

  const isOwnProfile = currentUser?.id === profile.id;

  const [avatarUrl, setAvatarUrl] = useState(
    profile.avatarUrl,
  );
  const [coverPhotoUrl, setCoverPhotoUrl] = useState(
    profile.coverPhotoUrl,
  );

  const basePath = `/profile/${profile.id}`;

  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
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

        {isOwnProfile && (
          <div className="absolute right-4 top-4">
            <SingleImageUploader
              type="USER_COVER"
              targetId={profile.id}
              currentUrl={coverPhotoUrl}
              variant="overlay"
              label="Change cover photo"
              onUploaded={(url) => setCoverPhotoUrl(url)}
            />
          </div>
        )}
      </div>

      <div className="px-6 pb-6">
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
                {profile.name.charAt(0).toUpperCase()}
              </div>
            )}

            {isOwnProfile && (
              <div className="absolute -bottom-2 -right-2">
                <SingleImageUploader
                  type="USER_PROFILE"
                  targetId={profile.id}
                  currentUrl={avatarUrl}
                  shape="circle"
                  variant="overlay"
                  label="Change profile photo"
                  onUploaded={(url) => setAvatarUrl(url)}
                />
              </div>
            )}
          </div>
        </div>

        <div className="mt-4">
          <h1 className="text-3xl font-bold text-gray-900">
            {profile.name}
          </h1>

          <p className="mt-1 text-gray-500">
            {profile.reviewCount} reviews
          </p>

          <ProfileActions
            userId={profile.id}
            userName={profile.name}
          />
        </div>

        <nav className="mt-8 border-t pt-4">
          <div className="flex flex-wrap gap-6 text-sm font-medium">
            {TABS.map((tab) => {
              const href = `${basePath}${tab.href}`;
              const isActive = pathname === href;

              return (
                <Link
                  key={tab.href}
                  href={href}
                  className={
                    isActive
                      ? 'text-black'
                      : 'text-gray-500 hover:text-black'
                  }
                >
                  {tab.label}
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </section>
  );
}