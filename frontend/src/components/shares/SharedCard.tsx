'use client';

import Link from 'next/link';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import PhotoGrid from '@/components/media/PhotoGrid';
import OptionsMenu from '@/components/common/OptionsMenu';
import {
  deleteShare,
  updateShare,
  ShareItem,
} from '@/services/share.service';

import ShareButton from './ShareButton';
import ShareReactionButton from './ShareReactionButton';
import ShareCommentSection from './ShareCommentSection';

// একজন user অন্যের review/post share করলে feed ও profile-এ এই card দেখায়।
// Reaction/comment এখানে এই share-এর নিজস্ব — মূল review/post-এর না।
export default function SharedCard({
  share,
  onDeleted,
  onUpdated,
}: {
  share: ShareItem;
  onDeleted?: (shareId: string) => void;
  onUpdated?: (share: ShareItem) => void;
}) {
  const { user } = useAuth();

  // Caption edit — ⋮ → Edit দিলে card-এর ভেতরেই textarea খোলে
  const [caption, setCaption] = useState(share.caption);
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState('');
  const [saving, setSaving] = useState(false);
  const [editError, setEditError] = useState('');

  useEffect(() => {
    setCaption(share.caption);
  }, [share.caption]);

  function startEditing() {
    setDraft(caption ?? '');
    setEditError('');
    setIsEditing(true);
  }

  async function handleSaveCaption() {
    setSaving(true);
    setEditError('');

    try {
      const res = await updateShare(share.id, draft);

      setCaption(res.data.caption);
      setIsEditing(false);
      onUpdated?.(res.data);
    } catch (err) {
      setEditError(
        err instanceof Error ? err.message : 'Could not save',
      );
    } finally {
      setSaving(false);
    }
  }

  const isMine = user?.id === share.userId;
  const { review, post } = share;

  async function handleDelete() {
    if (!confirm('Delete this share?')) return;

    try {
      await deleteShare(share.id);
      onDeleted?.(share.id);
    } catch (err) {
      alert(
        err instanceof Error ? err.message : 'Failed to delete',
      );
    }
  }

  return (
    <div className="rounded-lg border p-5">
      {/* Sharer */}
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-200 text-xs font-bold text-gray-600">
          {share.user.name.charAt(0).toUpperCase()}
        </div>

        <div className="min-w-0 flex-1">
          <p className="text-sm">
            <Link
              href={`/profile/${encodeURIComponent(share.userId)}`}
              className="font-medium hover:underline"
            >
              {share.user.name}
            </Link>{' '}
            <span className="text-gray-500">
              shared {review ? 'a review' : 'a post'}
            </span>
          </p>

          <Link
            href={`/shares/${share.id}`}
            className="text-xs text-gray-400 hover:underline"
          >
            {new Date(share.createdAt).toLocaleDateString()}
          </Link>
        </div>

        {/* Review card-এর মতোই ডান পাশে ⋮ — Delete এর ভেতরে */}
        {isMine && (
          <OptionsMenu
            label="Share options"
            items={[
              { label: 'Edit', onClick: startEditing },
              {
                label: 'Delete',
                onClick: handleDelete,
                danger: true,
              },
            ]}
          />
        )}
      </div>

      {isEditing ? (
        <div className="mt-3">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            maxLength={500}
            rows={3}
            placeholder="Say something about this (optional)..."
            className="w-full rounded-lg border p-3 text-sm text-gray-900"
          />

          <div className="mt-1 text-right text-xs text-gray-400">
            {draft.length}/500
          </div>

          {editError && (
            <p className="text-xs text-red-600">{editError}</p>
          )}

          <div className="mt-2 flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveCaption}
              className="rounded-lg bg-black px-4 py-2 text-sm text-white disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => setIsEditing(false)}
              className="rounded-lg border px-4 py-2 text-sm"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        caption && (
          <p className="mt-3 whitespace-pre-wrap text-sm">
            {caption}
          </p>
        )
      )}

      {/* Original review / post */}
      <div className="mt-3 rounded-lg border p-4">
        {review && (
          <>
            <div className="flex items-center justify-between">
              <Link
                href={`/profile/${encodeURIComponent(review.userId)}`}
                className="text-sm font-medium hover:underline"
              >
                {review.user.name}
              </Link>
              <p className="text-sm">⭐ {review.rating}</p>
            </div>

            <Link
              href={`/entities/${encodeURIComponent(review.entity.slug)}`}
              className="mt-1 block text-sm text-gray-500 hover:underline"
            >
              {review.entity.name}
            </Link>

            <p className="mt-2 whitespace-pre-wrap text-sm">
              {review.content}
            </p>

            {review.media.length > 0 && (
              <PhotoGrid photos={review.media} />
            )}
          </>
        )}

        {post && (
          <>
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-gray-200">
                {post.entity.logo ? (
                  <img
                    src={post.entity.logo}
                    alt={post.entity.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-gray-500">
                    {post.entity.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <Link
                href={`/entities/${encodeURIComponent(post.entity.slug)}`}
                className="text-sm font-medium hover:underline"
              >
                {post.entity.name}
              </Link>

              <span className="ml-auto text-xs text-gray-400">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>

            <p className="mt-2 whitespace-pre-wrap text-sm">
              {post.content}
            </p>

            {post.media.length > 0 && (
              <PhotoGrid photos={post.media} />
            )}
          </>
        )}
      </div>

      {/* Engagement — শুধু এই share-এর; ShareButton মূল review/post-কে
          share করে এবং মূলটার মোট share count দেখায় */}
      <div className="mt-4 border-t pt-3">
        <ShareReactionButton shareId={share.id} />
        <ShareCommentSection shareId={share.id} />
        <ShareButton
          reviewId={review?.id}
          entityPostId={post?.id}
        />
      </div>
    </div>
  );
}
