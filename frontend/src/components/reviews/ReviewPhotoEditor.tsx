'use client';

import { useEffect, useRef, useState } from 'react';

import type { ReviewMedia } from '@/services/review.service';

export const MAX_REVIEW_PHOTOS = 10;

// Save চাপলে parent (ReviewCard) এটা দিয়েই বুঝবে কী কী করতে হবে
export type PhotoEdits = {
  // আগের যে ছবিগুলো মুছতে হবে
  removedIds: string[];
  // নতুন যে ছবিগুলো upload করতে হবে
  newFiles: File[];
};

type NewPhoto = {
  file: File;
  url: string;
};

type ReviewPhotoEditorProps = {
  existingPhotos: ReviewMedia[];
  maxFiles?: number;
  disabled?: boolean;
  onChange: (edits: PhotoEdits) => void;
};

// Review edit করার সময় ছবি যোগ/মোছার UI।
// এখানে শুধু "কী করতে চাই" জমা থাকে — আসল delete/upload হয় Save চাপলে,
// তাই Cancel করলে কিছুই হারায় না।
export default function ReviewPhotoEditor({
  existingPhotos,
  maxFiles = MAX_REVIEW_PHOTOS,
  disabled = false,
  onChange,
}: ReviewPhotoEditorProps) {
  const [removedIds, setRemovedIds] = useState<string[]>([]);
  const [newPhotos, setNewPhotos] = useState<NewPhoto[]>([]);
  const [error, setError] = useState('');

  const inputRef = useRef<HTMLInputElement>(null);

  // unmount-এর সময় preview URL গুলো মুক্ত করা
  const newPhotosRef = useRef<NewPhoto[]>([]);
  newPhotosRef.current = newPhotos;

  useEffect(() => {
    return () => {
      newPhotosRef.current.forEach((p) =>
        URL.revokeObjectURL(p.url),
      );
    };
  }, []);

  const keptCount = existingPhotos.length - removedIds.length;
  const total = keptCount + newPhotos.length;
  const isFull = total >= maxFiles;

  function emit(ids: string[], photos: NewPhoto[]) {
    onChange({
      removedIds: ids,
      newFiles: photos.map((p) => p.file),
    });
  }

  function toggleExisting(id: string) {
    setError('');

    if (removedIds.includes(id)) {
      // ফিরিয়ে আনলে মোট সংখ্যা সীমা ছাড়াবে কি না
      if (isFull) {
        setError(
          `A review can have at most ${maxFiles} photos.`,
        );
        return;
      }

      const next = removedIds.filter((x) => x !== id);
      setRemovedIds(next);
      emit(next, newPhotos);
      return;
    }

    const next = [...removedIds, id];
    setRemovedIds(next);
    emit(next, newPhotos);
  }

  function removeNew(index: number) {
    URL.revokeObjectURL(newPhotos[index].url);

    const next = newPhotos.filter((_, i) => i !== index);
    setNewPhotos(next);
    setError('');
    emit(removedIds, next);
  }

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const incoming = Array.from(fileList).filter((f) =>
      f.type.startsWith('image/'),
    );

    if (inputRef.current) {
      inputRef.current.value = '';
    }

    if (incoming.length === 0) {
      setError('Only image files are allowed.');
      return;
    }

    const room = maxFiles - total;

    if (room <= 0) {
      setError(
        `A review can have at most ${maxFiles} photos.`,
      );
      return;
    }

    const accepted = incoming.slice(0, room);

    setError(
      incoming.length > room
        ? `Only ${room} more photo${room > 1 ? 's' : ''} could be added (max ${maxFiles}).`
        : '',
    );

    const next = [
      ...newPhotos,
      ...accepted.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    ];

    setNewPhotos(next);
    emit(removedIds, next);
  }

  return (
    <div className="mt-4">
      <p className="text-sm font-medium">
        Photos{' '}
        <span className="font-normal text-gray-500">
          ({total}/{maxFiles})
        </span>
      </p>

      {(existingPhotos.length > 0 || newPhotos.length > 0) && (
        <div className="mt-2 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {/* আগের ছবি — ✕ চাপলে "মোছা হবে" চিহ্ন, আবার চাপলে ফিরে আসে */}
          {existingPhotos.map((photo) => {
            const removed = removedIds.includes(photo.id);

            return (
              <div
                key={photo.id}
                className="relative aspect-square overflow-hidden rounded-lg border"
              >
                <img
                  src={photo.url}
                  alt=""
                  className={`h-full w-full object-cover transition ${
                    removed ? 'opacity-30 grayscale' : ''
                  }`}
                />

                {removed && (
                  <span className="absolute inset-x-0 bottom-0 bg-black/70 py-0.5 text-center text-[10px] text-white">
                    Will be removed
                  </span>
                )}

                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => toggleExisting(photo.id)}
                  aria-label={
                    removed
                      ? 'Keep this photo'
                      : 'Remove this photo'
                  }
                  className={`absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full text-xs text-white disabled:opacity-50 ${
                    removed ? 'bg-blue-600' : 'bg-black/70'
                  }`}
                >
                  {removed ? '↺' : '✕'}
                </button>
              </div>
            );
          })}

          {/* নতুন ছবি — এখনো upload হয়নি */}
          {newPhotos.map((photo, i) => (
            <div
              key={photo.url}
              className="relative aspect-square overflow-hidden rounded-lg border border-blue-500"
            >
              <img
                src={photo.url}
                alt=""
                className="h-full w-full object-cover"
              />

              <span className="absolute inset-x-0 bottom-0 bg-blue-600/80 py-0.5 text-center text-[10px] text-white">
                New
              </span>

              <button
                type="button"
                disabled={disabled}
                onClick={() => removeNew(i)}
                aria-label="Discard this new photo"
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white disabled:opacity-50"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => handleFiles(e.target.files)}
        className="hidden"
      />

      <button
        type="button"
        disabled={disabled || isFull}
        onClick={() => inputRef.current?.click()}
        className="mt-3 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-500/10 disabled:cursor-not-allowed disabled:opacity-50"
      >
        📷 Add photos
      </button>

      {error && (
        <p className="mt-1 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
