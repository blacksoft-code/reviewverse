'use client';

import Link from 'next/link';
import { useConfirm } from '@/components/common/ConfirmDialog';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import PhotoGrid from '@/components/media/PhotoGrid';
import OptionsMenu from '@/components/common/OptionsMenu';
import UserAvatar from '@/components/common/UserAvatar';
import { getAvatarUrl } from '@/lib/avatar';
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
  const { confirm, confirmDialog } = useConfirm();

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
    const ok = await confirm({
      title: 'Delete this share?',
      message: 'This share will be permanently removed.',
      confirmLabel: 'Delete',
      danger: true,
    });

    if (!ok) return;

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
    // Facebook post-এর মতো — parent-এর পুরো চওড়া নেয়, বড় screen-এ সর্বোচ্চ 680px
    // আর মাঝখানে বসে। মোবাইলে ভেতরের ফাঁকা জায়গা কম (p-4)।
    <div className="mx-auto w-full max-w-[680px] rounded-2xl bg-white p-4 text-[#1d1d1f] shadow-[0_4px_24px_rgba(91,155,255,0.12)] ring-1 ring-black/[0.04] sm:rounded-3xl sm:p-6">
      {confirmDialog}
      {/* Sharer */}
      <div className="flex items-center gap-3">
        <Link
          href={`/profile/${encodeURIComponent(share.userId)}`}
          className="shrink-0"
        >
          <UserAvatar
            name={share.user.name}
            url={getAvatarUrl(share.user)}
          />
        </Link>

        <div className="min-w-0 flex-1">
          <p className="text-sm leading-5">
            <Link
              href={`/profile/${encodeURIComponent(share.userId)}`}
              className="font-semibold hover:underline"
            >
              {share.user.name}
            </Link>{' '}
            <span className="text-[#6e6e73]">
              shared {review ? 'a review' : 'a post'}
            </span>
          </p>

          <Link
            href={`/shares/${share.id}`}
            className="text-xs text-[#8e8e93] hover:underline"
          >
            {new Date(share.createdAt).toLocaleDateString()}
          </Link>
        </div>

        {/* Review card-এর মতোই ডান পাশে ⋮ — Delete এর ভেতরে */}
        {isMine && (
          <div className="shrink-0">
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
          </div>
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
            className="w-full resize-none rounded-2xl bg-[#F6F9FC] px-4 py-3 text-sm text-[#1d1d1f] outline-none placeholder:text-[#8e8e93] focus:ring-2 focus:ring-[#5B9BFF]/40"
          />

          <div className="mt-1 text-right text-xs text-[#8e8e93]">
            {draft.length}/500
          </div>

          {editError && (
            <p className="mt-1 rounded-2xl bg-red-50 px-4 py-2 text-xs text-red-600">
              {editError}
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={handleSaveCaption}
              className="rounded-full bg-[#5B9BFF] px-5 py-2 text-sm font-medium text-white transition hover:bg-[#4a8cf5] disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => setIsEditing(false)}
              className="rounded-full bg-[#F6F9FC] px-5 py-2 text-sm font-medium text-[#1d1d1f] transition hover:bg-[#E6F4FD] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        caption && (
          <p className="mt-3 whitespace-pre-wrap text-[15px] leading-6">
            {caption}
          </p>
        )
      )}

      {/* Original review / post */}
      <div className="mt-3 rounded-2xl bg-[#F6F9FC] p-3 sm:p-4">
        {review && (
          <>
            <div className="flex items-center justify-between gap-3">
              <Link
                href={`/profile/${encodeURIComponent(review.userId)}`}
                className="flex min-w-0 items-center gap-2 text-sm font-semibold hover:underline"
              >
                <UserAvatar
                  name={review.user.name}
                  url={getAvatarUrl(review.user)}
                  size="sm"
                />
                <span className="truncate">{review.user.name}</span>
              </Link>

              <span className="shrink-0 rounded-full bg-[#FFF6E5] px-3 py-1 text-sm font-medium">
                ⭐ {review.rating}
              </span>
            </div>

            <Link
              href={`/entities/${encodeURIComponent(review.entity.slug)}`}
              className="mt-2 block text-sm text-[#6e6e73] hover:underline"
            >
              {review.entity.name}
            </Link>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
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
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E6F4FD] ring-2 ring-[#8FD3F4]/60">
                {post.entity.logo ? (
                  <img
                    src={post.entity.logo}
                    alt={post.entity.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-[#5B9BFF]">
                    {post.entity.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              <Link
                href={`/entities/${encodeURIComponent(post.entity.slug)}`}
                className="min-w-0 truncate text-sm font-semibold hover:underline"
              >
                {post.entity.name}
              </Link>

              <span className="ml-auto shrink-0 text-xs text-[#8e8e93]">
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
            </div>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6">
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
      <div className="mt-4 border-t border-black/5 pt-3">
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