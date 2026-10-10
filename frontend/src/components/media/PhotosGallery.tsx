'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';

import Lightbox from './Lightbox';
import type { PhotoItem, PhotoSource } from '@/services/media.service';

const SOURCE_LABELS: Record<PhotoSource, string> = {
  PROFILE: 'Profile photo',
  COVER: 'Cover photo',
  LOGO: 'Profile photo',
  REVIEW: 'Review',
  POST: 'Post',
};

// Filter chip-এ একই ধরনের ছবি এক জায়গায় (logo ও profile একই চিপ)
const FILTER_GROUPS: { key: string; label: string; sources: PhotoSource[] }[] =
  [
    { key: 'REVIEW', label: 'Reviews', sources: ['REVIEW'] },
    { key: 'POST', label: 'Posts', sources: ['POST'] },
    {
      key: 'PROFILE',
      label: 'Profile & cover',
      sources: ['PROFILE', 'LOGO', 'COVER'],
    },
  ];

export default function PhotosGallery({
  photos,
  emptyText,
}: {
  photos: PhotoItem[];
  emptyText: string;
}) {
  const [filter, setFilter] = useState<string>('ALL');
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(
    null,
  );

  const availableFilters = useMemo(
    () =>
      FILTER_GROUPS.filter((g) =>
        photos.some((p) => g.sources.includes(p.source)),
      ),
    [photos],
  );

  const visible = useMemo(() => {
    if (filter === 'ALL') return photos;

    const group = FILTER_GROUPS.find((g) => g.key === filter);

    return group
      ? photos.filter((p) => group.sources.includes(p.source))
      : photos;
  }, [photos, filter]);

  if (photos.length === 0) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
          📷
        </div>

        <h3 className="mt-4 text-lg font-semibold">No photos yet</h3>

        <p className="mt-2 text-sm text-gray-500">{emptyText}</p>
      </div>
    );
  }

  return (
    <>
      {availableFilters.length > 1 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {[
            { key: 'ALL', label: `All (${photos.length})` },
            ...availableFilters.map((g) => ({
              key: g.key,
              label: g.label,
            })),
          ].map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => setFilter(chip.key)}
              className={`rounded-full border px-3.5 py-1.5 text-sm transition ${
                filter === chip.key
                  ? 'border-gray-900 bg-gray-900 text-white'
                  : 'border-gray-300 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {chip.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((photo, index) => (
          <figure key={photo.id} className="group">
            <button
              type="button"
              onClick={() => setLightboxIndex(index)}
              className="relative block aspect-square w-full overflow-hidden rounded-xl bg-gray-100"
            >
              <img
                src={photo.url}
                alt={SOURCE_LABELS[photo.source]}
                loading="lazy"
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
              />

              <span className="absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white backdrop-blur">
                {SOURCE_LABELS[photo.source]}
              </span>
            </button>

            {photo.label && (
              <figcaption className="mt-1.5 truncate text-xs text-gray-500">
                {photo.href ? (
                  <Link href={photo.href} className="hover:underline">
                    {photo.label}
                  </Link>
                ) : (
                  photo.label
                )}
              </figcaption>
            )}
          </figure>
        ))}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={visible}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}
