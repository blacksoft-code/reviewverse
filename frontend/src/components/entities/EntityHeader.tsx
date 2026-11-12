'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import CopyableId from '@/components/common/CopyableId';
import EntityActions from '@/components/entities/EntityActions';
import EntityCover from '@/components/entities/EntityCover';
import EntityFollowersLink from '@/components/entities/EntityFollowersLink';
import ClaimBusinessButton from '@/components/entities/ClaimBusinessButton';
import { useAuth } from '@/context/AuthContext';
import {
  BusinessHour,
  getBusinessHours,
} from '@/services/business-hour.service';
import { updateEntity } from '@/services/entity-management.service';
import {
  getEntityMemberships,
  getMyMemberships,
} from '@/services/entity-membership.service';

export type EntityHeaderData = {
  id: string;
  slug: string;
  name: string;
  coverPhoto: string | null;
  // Cover photo-র উল্লম্ব অবস্থান (0–100), default 50
  coverPositionY?: number;
  logo: string | null;
  // ১২ অক্ষরের public ID — এটা দিয়ে search করলে সরাসরি এই business আসে
  publicId?: string | null;
  // "$", "$$" ...
  priceRange?: string | null;
  // Blue badge দেখাবে কিনা (Verified + paid plan, বা Admin দিলে) — Verified থাকা নিজে public না
  showBlueBadge?: boolean;
  averageRating: number;
  reviewCount: number;
  googleMapsUrl?: string | null;
  category: {
    name: string;
  };
};

const TABS = [
  { label: 'Reviews', href: '' },
  { label: 'Posts', href: '/posts' },
  { label: 'Services', href: '/services' },
  { label: 'Photos', href: '/photos' },
  { label: 'Amenities', href: '/amenities' },
  { label: 'Q&A', href: '/qa' },
  { label: 'About', href: '/about' },
] as const;

// "14:30" → "2:30 PM"
function formatTime(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number);
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 === 0 ? 12 : h % 12;

  return `${hour12}:${String(m).padStart(2, '0')} ${period}`;
}

// Backend-এর isOpenNow Dhaka সময়ে চলে — তাই "আজকের" দিনও Dhaka অনুযায়ী
function dhakaDayOfWeek() {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Dhaka',
    weekday: 'short',
  }).format(new Date());

  return ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(
    weekday,
  );
}

// "10:00 AM - 12:00 AM (Next day)"
function todayHoursLabel(hours: BusinessHour[]) {
  const today = hours.find(
    (h) => h.dayOfWeek === dhakaDayOfWeek(),
  );

  if (!today) return null;
  if (today.isClosed || !today.openTime || !today.closeTime) {
    return 'Closed today';
  }

  const nextDay = today.closeTime <= today.openTime;

  return `${formatTime(today.openTime)} - ${formatTime(today.closeTime)}${
    nextDay ? ' (Next day)' : ''
  }`;
}

function StarBox({ filled }: { filled: boolean }) {
  return (
    <span
      className={`flex h-7 w-7 items-center justify-center rounded-md sm:h-8 sm:w-8 ${
        filled ? 'bg-[#ff7a45]' : 'bg-white/25'
      }`}
    >
      <svg
        viewBox="0 0 20 20"
        className="h-4 w-4 fill-white sm:h-[18px] sm:w-[18px]"
        aria-hidden="true"
      >
        <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.8 4.8 17.6l1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
      </svg>
    </span>
  );
}

export default function EntityHeader({
  entity,
}: {
  entity: EntityHeaderData;
}) {
  const pathname = usePathname();
  const basePath = `/entities/${entity.slug}`;
  const { user } = useAuth();

  const [isOpenNow, setIsOpenNow] = useState<boolean | null>(
    null,
  );
  const [hoursLabel, setHoursLabel] = useState<string | null>(
    null,
  );
  const [isClaimed, setIsClaimed] = useState(false);
  const [canManage, setCanManage] = useState(false);

  // Cover reposition
  const initialY = entity.coverPositionY ?? 50;
  const [savedY, setSavedY] = useState(initialY);
  const [positionY, setPositionY] = useState(initialY);
  const [repositioning, setRepositioning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [coverError, setCoverError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function loadHours() {
      try {
        const response = await getBusinessHours(entity.id);

        if (!cancelled) {
          setIsOpenNow(response.data.isOpenNow);
          setHoursLabel(todayHoursLabel(response.data.hours));
        }
      } catch {
        // business hours সেট করা না থাকলে hours-এর লাইনটাই দেখানো হবে না
        if (!cancelled) {
          setIsOpenNow(null);
          setHoursLabel(null);
        }
      }
    }

    async function loadClaimed() {
      try {
        const response = await getEntityMemberships(entity.id);

        if (!cancelled) {
          setIsClaimed(
            response.data.some((m) => m.role === 'OWNER'),
          );
        }
      } catch {
        // চেক ব্যর্থ হলে "Claimed" লেখা দেখানো হবে না
      }
    }

    loadHours();
    loadClaimed();

    return () => {
      cancelled = true;
    };
  }, [entity.id]);

  // এই business-এর member (owner/manager/employee) হলে cover reposition করতে পারবে
  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setCanManage(false);
      return;
    }

    getMyMemberships()
      .then((response) => {
        if (!cancelled) {
          setCanManage(
            response.data.some((m) => m.entityId === entity.id),
          );
        }
      })
      .catch(() => {
        if (!cancelled) setCanManage(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user, entity.id]);

  async function saveReposition() {
    setSaving(true);
    setCoverError('');

    try {
      const y = Math.round(positionY * 10) / 10;

      await updateEntity(entity.id, { coverPositionY: y });

      setSavedY(y);
      setPositionY(y);
      setRepositioning(false);
    } catch (error) {
      setCoverError(
        error instanceof Error
          ? error.message
          : 'Could not save the position',
      );
    } finally {
      setSaving(false);
    }
  }

  function cancelReposition() {
    setPositionY(savedY);
    setRepositioning(false);
    setCoverError('');
  }

  const filledStars = Math.round(entity.averageRating ?? 0);

  const metaParts = [
    entity.priceRange || null,
    entity.category.name,
  ].filter(Boolean) as string[];

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6">
      {/* ───────── Hero ───────── */}
      <section className="relative mt-4 flex min-h-[26rem] flex-col justify-end rounded-3xl bg-gradient-to-br from-[#3a3a3c] to-[#1c1c1e] sm:min-h-[28rem]">
        {entity.coverPhoto && (
          <EntityCover
            src={entity.coverPhoto}
            alt={`${entity.name} cover`}
            positionY={positionY}
            repositioning={repositioning}
            onPositionChange={setPositionY}
          />
        )}

        {/* লেখা পরিষ্কার পড়ার জন্য নিচ থেকে কালো shade */}
        <div
          className={`pointer-events-none absolute inset-0 rounded-3xl bg-gradient-to-t from-black/85 via-black/35 to-black/10 transition-opacity duration-300 ${
            repositioning ? 'opacity-0' : 'opacity-100'
          }`}
        />

        {/* ───── Public ID card (উপরে ডানে) ───── */}
        {entity.publicId && (
          <div className="absolute right-3 top-3 z-20 rounded-2xl bg-black/70 px-3 py-2 text-white shadow-lg ring-1 ring-white/10 backdrop-blur-md sm:right-5 sm:top-5 sm:px-4 sm:py-2.5">
            <p className="text-[10px] font-medium uppercase tracking-[0.14em] text-white/70">
              Business ID
            </p>

            <CopyableId
              value={entity.publicId}
              className="mt-0.5 text-xs text-white sm:text-sm"
              buttonClassName="rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium text-white transition hover:bg-white/25"
            />
          </div>
        )}

        {/* ───── Reposition controls (উপরে বামে) ───── */}
        {canManage && entity.coverPhoto && (
          <div className="absolute left-3 top-3 z-20 flex flex-wrap items-center gap-2 sm:left-5 sm:top-5">
            {repositioning ? (
              <>
                <button
                  type="button"
                  onClick={saveReposition}
                  disabled={saving}
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>

                <button
                  type="button"
                  onClick={cancelReposition}
                  disabled={saving}
                  className="rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-md disabled:opacity-50"
                >
                  Cancel
                </button>
              </>
            ) : (
              <button
                type="button"
                onClick={() => setRepositioning(true)}
                className="rounded-full bg-black/60 px-4 py-2 text-sm font-medium text-white backdrop-blur-md transition hover:bg-black/75"
              >
                ⇅ Reposition
              </button>
            )}
          </div>
        )}

        {repositioning && (
          <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex flex-col items-center gap-2 px-4">
            <span className="rounded-full bg-black/65 px-4 py-2 text-sm text-white backdrop-blur-md">
              Drag the photo to reposition
            </span>

            {coverError && (
              <span className="rounded-full bg-red-600 px-4 py-1.5 text-xs text-white">
                {coverError}
              </span>
            )}
          </div>
        )}

        {/* ───── নাম, rating, তথ্য ───── */}
        <div
          className={`relative z-10 p-5 pt-24 text-white transition-opacity duration-300 sm:p-8 ${
            repositioning
              ? 'pointer-events-none opacity-0'
              : 'opacity-100'
          }`}
        >
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-2 border-white/80 bg-gray-200 shadow-lg sm:h-[72px] sm:w-[72px]">
              {entity.logo ? (
                <img
                  src={entity.logo}
                  alt={`${entity.name} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-gray-500 sm:text-3xl">
                  {entity.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div className="flex min-w-0 items-center gap-2">
              <h1 className="min-w-0 break-words text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
                {entity.name}
              </h1>

              {entity.showBlueBadge && (
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500 text-sm text-white"
                  title="Blue badge"
                >
                  ✓
                </span>
              )}
            </div>
          </div>

          {/* ⭐ rating */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((n) => (
                <StarBox key={n} filled={n <= filledStars} />
              ))}
            </div>

            <span className="text-base font-medium">
              {entity.averageRating?.toFixed(1) ?? '0.0'} (
              {entity.reviewCount} reviews)
            </span>
          </div>

          {/* Claimed • $$ • Category */}
          <div className="mt-3 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] font-medium">
            {isClaimed && (
              <>
                <span className="flex items-center gap-1.5 text-[#64b5ff]">
                  <svg
                    viewBox="0 0 20 20"
                    className="h-4 w-4 fill-current"
                    aria-hidden="true"
                  >
                    <path d="M10 1.5a8.5 8.5 0 100 17 8.5 8.5 0 000-17zm4.1 6.6l-4.8 5a.8.8 0 01-1.1 0L5.9 10.8a.8.8 0 111.1-1.1l1.8 1.7 4.2-4.4a.8.8 0 111.1 1.1z" />
                  </svg>
                  Claimed
                </span>
                <span className="text-white/50">•</span>
              </>
            )}

            {metaParts.map((part, i) => (
              <span key={part} className="flex items-center gap-2.5">
                {i > 0 && (
                  <span className="text-white/50">•</span>
                )}
                {part}
              </span>
            ))}
          </div>

          {/* Open 10:00 AM - 12:00 AM (Next day)  [See hours] */}
          {isOpenNow !== null && (
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px]">
              <span className="flex flex-wrap items-center gap-x-2">
                <span
                  className={`font-semibold ${
                    isOpenNow
                      ? 'text-[#34c759]'
                      : 'text-[#ff6961]'
                  }`}
                >
                  {isOpenNow ? 'Open' : 'Closed'}
                </span>

                {hoursLabel && (
                  <span className="font-medium">
                    {hoursLabel}
                  </span>
                )}
              </span>

              <Link
                href={`${basePath}/about`}
                className="rounded-full border border-white/40 px-4 py-1.5 text-sm font-medium transition hover:bg-white/15"
              >
                See hours
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ───────── Actions ───────── */}
      <section className="mt-3 flex flex-wrap items-center gap-2.5 rounded-3xl bg-black px-4 py-3 text-white sm:px-5">
        <EntityActions entityId={entity.id} />

        <div className="[&_a]:rounded-full [&_button]:rounded-full [&_button:hover]:bg-white/10 [&_span]:rounded-full">
          <ClaimBusinessButton entityId={entity.id} />
        </div>

        {/* Google Maps — click করলে নতুন tab-এ location খোলে */}
        {entity.googleMapsUrl && (
          <a
            href={entity.googleMapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
          >
            📍 View on Google Maps
          </a>
        )}

        <EntityFollowersLink
          entityId={entity.id}
          slug={entity.slug}
          className="px-2 text-sm text-white/70 hover:text-white hover:underline"
        />
      </section>

      <nav className="mt-3 overflow-x-auto rounded-xl bg-black">
        <div className="flex min-w-max border-b">
          {TABS.map((tab) => {
            const href = `${basePath}${tab.href}`;
            const isActive = pathname === href;

            return (
              <Link
                key={tab.href}
                href={href}
                className={
                  isActive
                    ? 'border-b-2 border-black px-6 py-4 text-sm font-medium'
                    : 'px-6 py-4 text-sm font-medium text-gray-600 hover:text-black'
                }
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <section className="mt-4 rounded-xl bg-black p-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link
            href={`${basePath}/add_a_review`}
            className="rounded-lg border px-4 py-3 text-center text-sm font-medium hover:bg-[#B91C1C]"
          >
            Add review
          </Link>
        </div>
      </section>
    </div>
  );
}
