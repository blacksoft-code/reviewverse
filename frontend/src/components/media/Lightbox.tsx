'use client';

import { useEffect, useState } from 'react';

export type GridPhoto = {
  id: string;
  url: string;
};

type LightboxProps = {
  photos: GridPhoto[];
  startIndex: number;
  onClose: () => void;
};

export default function Lightbox({
  photos,
  startIndex,
  onClose,
}: LightboxProps) {
  const [index, setIndex] = useState(startIndex);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') {
        setIndex((i) =>
          Math.min(i + 1, photos.length - 1),
        );
      }
      if (e.key === 'ArrowLeft') {
        setIndex((i) => Math.max(i - 1, 0));
      }
    }

    window.addEventListener('keydown', handleKey);
    return () =>
      window.removeEventListener(
        'keydown',
        handleKey,
      );
  }, [photos.length, onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 text-2xl text-white hover:text-gray-300"
      >
        ✕
      </button>

      {index > 0 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIndex((i) => i - 1);
          }}
          className="absolute left-4 text-3xl text-white hover:text-gray-300"
        >
          ‹
        </button>
      )}

      {/* object-contain — original ratio অক্ষুণ্ণ থাকে, crop হয় না */}
      <img
        src={photos[index].url}
        alt=""
        onClick={(e) => e.stopPropagation()}
        className="max-h-[90vh] max-w-[90vw] object-contain"
      />

      {index < photos.length - 1 && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setIndex((i) => i + 1);
          }}
          className="absolute right-4 text-3xl text-white hover:text-gray-300"
        >
          ›
        </button>
      )}

      <span className="absolute bottom-4 text-sm text-white">
        {index + 1} / {photos.length}
      </span>
    </div>
  );
}