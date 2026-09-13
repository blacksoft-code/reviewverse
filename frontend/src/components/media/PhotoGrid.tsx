'use client';

import { useState } from 'react';
import Lightbox, { GridPhoto } from './Lightbox';

export type { GridPhoto };

export default function PhotoGrid({
  photos,
}: {
  photos: GridPhoto[];
}) {
  const [lightboxIndex, setLightboxIndex] = useState<
    number | null
  >(null);

  if (!photos || photos.length === 0) {
    return null;
  }

  const count = photos.length;
  const visible = photos.slice(0, 4);
  const extraCount = count - 4;

  function open(index: number) {
    setLightboxIndex(index);
  }

  return (
    <>
      <div className="mt-3 overflow-hidden rounded-lg">
        {/* ১টা ছবি — ratio অক্ষুণ্ণ রেখে দেখানো, crop নেই */}
        {count === 1 && (
          <button
            type="button"
            onClick={() => open(0)}
            className="block w-full"
          >
            <img
              src={photos[0].url}
              alt="Photo"
              className="max-h-[500px] w-full bg-gray-50 object-contain"
            />
          </button>
        )}

        {/* ২টা ছবি — পাশাপাশি */}
        {count === 2 && (
          <div className="grid grid-cols-2 gap-0.5">
            {photos.map((p, i) => (
              <button
                key={p.id}
                type="button"
                onClick={() => open(i)}
                className="aspect-square"
              >
                <img
                  src={p.url}
                  alt="Photo"
                  className="h-full w-full object-cover"
                />
              </button>
            ))}
          </div>
        )}

        {/* ৩টা ছবি — বামে ২টা স্ট্যাক, ডানে ১টা পুরো উচ্চতা */}
        {count === 3 && (
          <div
            className="grid grid-cols-2 grid-rows-2 gap-0.5"
            style={{ height: 320 }}
          >
            <button
              type="button"
              onClick={() => open(0)}
              className="col-start-1 row-start-1 block h-full w-full"
            >
              <img
                src={photos[0].url}
                alt="Photo"
                className="h-full w-full object-cover"
              />
            </button>

            <button
              type="button"
              onClick={() => open(1)}
              className="col-start-2 row-span-2 row-start-1 block h-full w-full"
            >
              <img
                src={photos[1].url}
                alt="Photo"
                className="h-full w-full object-cover"
              />
            </button>

            <button
              type="button"
              onClick={() => open(2)}
              className="col-start-1 row-start-2 block h-full w-full"
            >
              <img
                src={photos[2].url}
                alt="Photo"
                className="h-full w-full object-cover"
              />
            </button>
          </div>
        )}

        {/* ৪টা বা তার বেশি — 2x2 গ্রিড, ৫+ হলে শেষ সেলে "+N" ওভারলে */}
        {count >= 4 && (
          <div
            className="grid grid-cols-2 grid-rows-2 gap-0.5"
            style={{ height: 320 }}
          >
            {visible.map((p, i) => {
              const isLastCell = i === 3;
              const showOverlay =
                isLastCell && extraCount > 0;

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => open(i)}
                  className="relative block h-full w-full"
                >
                  <img
                    src={p.url}
                    alt="Photo"
                    className={`h-full w-full object-cover ${
                      showOverlay
                        ? 'opacity-50'
                        : ''
                    }`}
                  />

                  {showOverlay && (
                    <span className="absolute inset-0 flex items-center justify-center text-2xl font-semibold text-white">
                      +{extraCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          startIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </>
  );
}