'use client';

import {
  ChangeEvent,
  useEffect,
  useState,
} from 'react';

import {
  MediaType,
  uploadImage,
} from '@/services/media.service';

type SingleImageUploaderProps = {
  type: MediaType;
  targetId: string;
  currentUrl?: string | null;
  label?: string;
  shape?: 'circle' | 'rectangle';
  // 'standalone' — নিজের বড় প্রিভিউ বক্স দেখাবে (যেমন business
  // edit-info ফর্মে, যেখানে অন্য কোনো ছবি already নেই)
  // 'overlay' — শুধু ছোট একটা বাটন (কোনো বড় বক্স/প্রিভিউ না),
  // যখন এটা অন্য কোনো <img>-এর উপরে বসানো হয় (যেমন profile avatar/cover)
  variant?: 'standalone' | 'overlay';
  onUploaded: (url: string) => void;
};

export default function SingleImageUploader({
  type,
  targetId,
  currentUrl,
  label = 'Change photo',
  shape = 'rectangle',
  variant = 'standalone',
  onUploaded,
}: SingleImageUploaderProps) {
  const [preview, setPreview] = useState<
    string | null
  >(currentUrl ?? null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  // NEW: parent থেকে currentUrl পরে (async load হওয়ার পর)
  // বদলালে uploader-এর নিজের preview-ও sync হবে
  useEffect(() => {
    setPreview(currentUrl ?? null);
  }, [currentUrl]);

  async function handleChange(
    e: ChangeEvent<HTMLInputElement>,
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setPreview(URL.createObjectURL(file));
    setUploading(true);
    setError('');

    try {
      const media = await uploadImage(
        file,
        type,
        targetId,
      );
      setPreview(media.url);
      onUploaded(media.url);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Upload failed',
      );
    } finally {
      setUploading(false);
    }
  }

  // ── overlay variant: শুধু ছোট camera-আইকন বাটন, কোনো বড় বক্স/প্রিভিউ না ──
  if (variant === 'overlay') {
    return (
      <div>
        <label
          className={`flex cursor-pointer items-center justify-center rounded-full bg-white shadow ${
            shape === 'circle'
              ? 'h-9 w-9'
              : 'h-9 w-9'
          } ${uploading ? 'opacity-50' : ''}`}
          title={label}
        >
          {uploading ? (
            <span className="text-xs">...</span>
          ) : (
            <span className="text-base">📷</span>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {error && (
          <p className="mt-1 text-xs text-red-600">
            {error}
          </p>
        )}
      </div>
    );
  }

  // ── standalone variant (আগের মতোই) — নিজের বক্স + প্রিভিউ ──
  return (
    <div>
      <div
        className={`overflow-hidden bg-gray-100 ${
          shape === 'circle'
            ? 'h-24 w-24 rounded-full'
            : 'h-32 w-full rounded-lg'
        }`}
      >
        {preview && (
          <img
            src={preview}
            alt=""
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <label className="mt-2 inline-block cursor-pointer text-sm font-medium text-blue-600 hover:underline">
        {uploading ? 'Uploading...' : label}
        <input
          type="file"
          accept="image/*"
          onChange={handleChange}
          disabled={uploading}
          className="hidden"
        />
      </label>

      {error && (
        <p className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}