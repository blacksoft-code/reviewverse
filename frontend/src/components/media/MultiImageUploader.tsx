'use client';

import { useRef, useState } from 'react';

type PreviewItem = {
  file: File;
  url: string;
};

type MultiImageUploaderProps = {
  maxFiles?: number;
  onChange: (files: File[]) => void;
};

export default function MultiImageUploader({
  maxFiles = 10,
  onChange,
}: MultiImageUploaderProps) {
  const [previews, setPreviews] = useState<
    PreviewItem[]
  >([]);
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    const incoming = Array.from(fileList).filter(
      (f) => f.type.startsWith('image/'),
    );

    if (previews.length + incoming.length > maxFiles) {
      setError(
        `Maximum ${maxFiles} photos allowed.`,
      );
      return;
    }

    setError('');

    const newPreviews = [
      ...previews,
      ...incoming.map((file) => ({
        file,
        url: URL.createObjectURL(file),
      })),
    ];

    setPreviews(newPreviews);
    onChange(newPreviews.map((p) => p.file));

    if (inputRef.current) {
      inputRef.current.value = '';
    }
  }

  function removeAt(index: number) {
    const updated = previews.filter(
      (_, i) => i !== index,
    );
    setPreviews(updated);
    onChange(updated.map((p) => p.file));
    setError('');
  }

  return (
    <div className="mt-3">
      <input
        ref={inputRef}
        id="multi-image-input"
        type="file"
        accept="image/*"
        multiple
        onChange={(e) =>
          handleFiles(e.target.files)
        }
        className="hidden"
      />

      <label
        htmlFor="multi-image-input"
        className="inline-block cursor-pointer rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
      >
        📷 Add photos ({previews.length}/{maxFiles})
      </label>

      {error && (
        <p className="mt-1 text-xs text-red-600">
          {error}
        </p>
      )}

      {previews.length > 0 && (
        <div className="mt-3 grid grid-cols-4 gap-2 sm:grid-cols-5">
          {previews.map((p, i) => (
            <div
              key={i}
              className="relative aspect-square overflow-hidden rounded-lg border"
            >
              <img
                src={p.url}
                alt=""
                className="h-full w-full object-cover"
              />

              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-white"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}