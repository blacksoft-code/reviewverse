'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import EntityActions from '@/components/entities/EntityActions';
import EntityFollowersLink from '@/components/entities/EntityFollowersLink';
import ClaimBusinessButton from '@/components/entities/ClaimBusinessButton';

export type EntityHeaderData = {
  id: string;
  slug: string;
  name: string;
  coverPhoto: string | null;
  logo: string | null;
  isVerified: boolean;
  averageRating: number;
  reviewCount: number;
  businessHours: string | null;
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

export default function EntityHeader({
  entity,
}: {
  entity: EntityHeaderData;
}) {
  const pathname = usePathname();
  const basePath = `/entities/${entity.slug}`;

  return (
    <>
      <div className="h-64 w-full bg-gray-300">
        {entity.coverPhoto ? (
          <img
            src={entity.coverPhoto}
            alt={`${entity.name} cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            No cover photo
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <section className="relative rounded-b-xl bg-black px-6 pb-6">
          <div className="-mt-16 flex items-end">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow">
              {entity.logo ? (
                <img
                  src={entity.logo}
                  alt={`${entity.name} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-gray-500">
                  {entity.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>
          </div>

          <div className="mt-4">
            <p className="text-sm text-gray-500">
              {entity.category.name}
            </p>

            <div className="mt-1 flex items-center gap-2">
              <h1 className="text-3xl font-bold">
                {entity.name}
              </h1>

              {entity.isVerified && (
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-sm text-white"
                  title="Verified business"
                >
                  ✓
                </span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="font-semibold">
                ⭐ {entity.averageRating?.toFixed(1) ?? '0.0'}
              </span>

              <span className="text-gray-500">
                ({entity.reviewCount} reviews)
              </span>

              <span className="text-gray-400">•</span>

              <span className="font-medium text-green-600">
                Open
              </span>

              {entity.businessHours && (
                <>
                  <span className="text-gray-600">
                    {entity.businessHours}
                  </span>

                  <button
                    type="button"
                    className="font-medium underline"
                  >
                    See hours
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <EntityFollowersLink
              entityId={entity.id}
              slug={entity.slug}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <EntityActions entityId={entity.id} />
            <ClaimBusinessButton entityId={entity.id} />

            <button
              type="button"
              className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Message
            </button>

            <button
              type="button"
              className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              More
            </button>
          </div>
        </section>

        <nav className="mt-4 overflow-x-auto rounded-xl bg-black">
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

            <button
              type="button"
              className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-[#B91C1C]"
            >
              📷 Add photos
            </button>

            <button
              type="button"
              className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-[#B91C1C]"
            >
              🔖 Save
            </button>

            <button
              type="button"
              className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-[#B91C1C]"
            >
              ↗ Share
            </button>
          </div>
        </section>
      </div>
    </>
  );
}