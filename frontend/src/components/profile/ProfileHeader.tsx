'use client';

import { ChangeEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import SingleImageUploader from '@/components/media/SingleImageUploader';
import Lightbox from '@/components/media/Lightbox';
import { uploadImage } from '@/services/media.service';
import ProfileActions from '@/components/profile/ProfileActions';

export type ProfileHeaderData = {
  id: string;
  name: string;
  reviewCount: number;
  avatarUrl: string | null;
  coverPhotoUrl: string | null;
};

const TABS = [
  { label: 'Timeline', href: '' },
  { label: 'About', href: '/about' },
  { label: 'Friends', href: '/friends' },
  { label: 'Photos', href: '/photos' },
  { label: 'Shares', href: '/shares' },
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

  // ── Profile picture-এর উপর click: dropdown ──
  //  • See profile picture    → বড় করে দেখা
  //  • Choose profile picture → নতুন ছবি বেছে বদলানো (শুধু নিজের profile-এ)
  const [menuOpen, setMenuOpen] = useState(false);
  const [viewerOpen, setViewerOpen] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState('');

  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // বাইরে click বা Esc চাপলে dropdown বন্ধ
  useEffect(() => {
    if (!menuOpen) return;

    function onClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  function handleAvatarClick() {
    // অন্যের profile: dropdown ছাড়াই সরাসরি ছবি বড় করে দেখা (ছবি থাকলে)
    if (!isOwnProfile) {
      if (avatarUrl) setViewerOpen(true);
      return;
    }

    setMenuOpen((open) => !open);
  }

  async function handleChooseFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';

    if (!file) return;

    setUploadingAvatar(true);
    setAvatarError('');

    try {
      const media = await uploadImage(
        file,
        'USER_PROFILE',
        profile.id,
      );
      setAvatarUrl(media.url);
    } catch (err) {
      setAvatarError(
        err instanceof Error ? err.message : 'Upload failed',
      );
    } finally {
      setUploadingAvatar(false);
    }
  }

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
          <div ref={menuRef} className="relative h-32 w-32">
            <button
              type="button"
              onClick={handleAvatarClick}
              aria-haspopup={isOwnProfile ? 'menu' : undefined}
              aria-expanded={isOwnProfile ? menuOpen : undefined}
              aria-label="Profile picture"
              disabled={!isOwnProfile && !avatarUrl}
              className={`block rounded-full ${
                isOwnProfile || avatarUrl
                  ? 'cursor-pointer hover:opacity-90'
                  : 'cursor-default'
              } ${uploadingAvatar ? 'opacity-60' : ''}`}
            >
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
            </button>

            {uploadingAvatar && (
              <span className="pointer-events-none absolute inset-0 flex items-center justify-center rounded-full bg-black/30 text-sm font-medium text-white">
                Uploading…
              </span>
            )}

            {/* নিজের profile-এ ছবির উপর click করলে নিচে নামা dropdown */}
            {isOwnProfile && menuOpen && (
              <div
                role="menu"
                className="absolute left-0 top-full z-30 mt-2 w-60 overflow-hidden rounded-xl border bg-white py-1 shadow-lg"
              >
                <button
                  type="button"
                  role="menuitem"
                  disabled={!avatarUrl}
                  onClick={() => {
                    setMenuOpen(false);
                    setViewerOpen(true);
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-400 disabled:hover:bg-transparent"
                >
                  See profile picture
                </button>

                <button
                  type="button"
                  role="menuitem"
                  onClick={() => {
                    setMenuOpen(false);
                    fileInputRef.current?.click();
                  }}
                  className="block w-full px-4 py-2.5 text-left text-sm text-gray-800 hover:bg-gray-100"
                >
                  Choose profile picture
                </button>
              </div>
            )}

            {/* "Choose profile picture"-এর ফাইল বাছাই */}
            {isOwnProfile && (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleChooseFile}
                className="hidden"
              />
            )}

            {avatarError && (
              <p className="absolute left-0 top-full mt-2 w-60 text-xs text-red-600">
                {avatarError}
              </p>
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

          {/* Edit Profile এখন Settings-এ (Settings → Edit profile) */}
          {!isOwnProfile && (
            <ProfileActions
              userId={profile.id}
              userName={profile.name}
            />
          )}
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

      {viewerOpen && avatarUrl && (
        <Lightbox
          photos={[{ id: 'profile-picture', url: avatarUrl }]}
          startIndex={0}
          onClose={() => setViewerOpen(false)}
        />
      )}
    </section>
  );
}