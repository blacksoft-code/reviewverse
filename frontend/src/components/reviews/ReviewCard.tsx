'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

import PhotoGrid from '@/components/media/PhotoGrid';
import ReactionButton from '@/components/reviews/ReactionButton';
import CommentSection from '@/components/reviews/CommentSection';
import ShareButton from '@/components/shares/ShareButton';
import {
  Review,
  deleteReview,
  updateReview,
} from '@/services/review.service';

type ReviewCardProps = {
  // group-এর latest review
  review: Review;
  // একই (user + offering)-এর পুরনো review ("more..." এর নিচে)
  olderReviews: Review[];
  // 'entity' = business-এর page (review-এর লেখকের নাম দেখায়)
  // 'profile' = user-এর profile (কোন business-এর review সেটা দেখায়)
  variant: 'entity' | 'profile';
  currentUserId?: string | null;
  // CommentSection-এর জন্য — এই review যে business-এর
  entityId: string;
  // Notification link থেকে এলে comment খোলা অবস্থায় আসে
  autoOpenComments?: boolean;
  onUpdated: (updated: Review) => void;
  onDeleted: (reviewId: string, promoted: Review | null) => void;
};

// একটা review card — Entity page আর User profile দুই জায়গায় এটাই ব্যবহার হয়।
// ⋮ menu (Edit / Delete), rating, offering, ছবি, reaction/share/comment আর
// পুরনো review ("more...") সবই এখানে — এক জায়গায় বদলালে সব জায়গায় বদলায়।
export default function ReviewCard({
  review,
  olderReviews,
  variant,
  currentUserId,
  entityId,
  autoOpenComments = false,
  onUpdated,
  onDeleted,
}: ReviewCardProps) {
  const isOwner =
    !!currentUserId && currentUserId === review.userId;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editingRating, setEditingRating] = useState(5);
  const [editingContent, setEditingContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [commentsOpen, setCommentsOpen] = useState(autoOpenComments);
  const [olderOpen, setOlderOpen] = useState(false);

  useEffect(() => {
    if (autoOpenComments) setCommentsOpen(true);
  }, [autoOpenComments]);

  // বাইরে click বা Esc চাপলে ⋮ menu বন্ধ
  useEffect(() => {
    if (!menuOpen) return;

    function onClick(e: MouseEvent) {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node)
      ) {
        setMenuOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setMenuOpen(false);
    }

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  function startEditing() {
    setMenuOpen(false);
    setIsEditing(true);
    setEditingRating(review.rating);
    setEditingContent(review.content);
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditingRating(5);
    setEditingContent('');
  }

  async function handleUpdate() {
    setIsLoading(true);

    try {
      const response = await updateReview(review.id, {
        rating: editingRating,
        content: editingContent,
      });

      onUpdated({
        ...review,
        ...response.data,
        user: review.user,
        entity: review.entity,
        offering: review.offering,
        media: review.media,
      });

      cancelEditing();
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  async function handleDelete() {
    setMenuOpen(false);

    const confirmed = window.confirm(
      'Are you sure you want to delete this review?',
    );

    if (!confirmed) return;

    setIsLoading(true);

    try {
      const response = await deleteReview(review.id);
      onDeleted(review.id, response.promotedReview ?? null);
    } catch (error) {
      console.error(error);
      setIsLoading(false);
    }
  }

  // ⋮ — review-এর ডান পাশে, শুধু নিজের review-তে
  const optionsMenu = isOwner && (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        aria-label="Review options"
        disabled={isLoading}
        className="flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-gray-500 hover:bg-gray-100 disabled:opacity-50"
      >
        ⋮
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border bg-white py-1 text-gray-800 shadow-lg"
        >
          <button
            type="button"
            role="menuitem"
            onClick={startEditing}
            className="block w-full px-4 py-2 text-left text-sm hover:bg-gray-100"
          >
            Edit
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );

  const containerClass =
    variant === 'profile'
      ? 'rounded-xl bg-white p-6 text-gray-900 shadow-sm transition-shadow'
      : 'rounded-lg border p-5 transition-shadow';

  return (
    <article id={`review-${review.id}`} className={containerClass}>
      {isEditing ? (
        <>
          <select
            value={editingRating}
            onChange={(event) =>
              setEditingRating(Number(event.target.value))
            }
            className="rounded-lg border p-3 text-gray-900"
          >
            <option value={5}>⭐⭐⭐⭐⭐ — 5</option>
            <option value={4}>⭐⭐⭐⭐ — 4</option>
            <option value={3}>⭐⭐⭐ — 3</option>
            <option value={2}>⭐⭐ — 2</option>
            <option value={1}>⭐ — 1</option>
          </select>

          <textarea
            value={editingContent}
            onChange={(event) =>
              setEditingContent(event.target.value)
            }
            rows={4}
            className="mt-3 w-full rounded-lg border p-3 text-gray-900"
          />

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleUpdate}
              className="rounded-lg bg-black px-4 py-2 text-white disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={cancelEditing}
              className="rounded-lg border px-4 py-2"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          {variant === 'entity' ? (
            <div className="flex items-center justify-between gap-3">
              <strong>{review.user?.name ?? 'User'}</strong>

              <div className="flex items-center gap-1">
                <span>⭐ {review.rating}</span>
                {optionsMenu}
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-start justify-between gap-4">
                <div>
                  {review.entity ? (
                    <>
                      <Link
                        href={`/entities/${review.entity.slug}`}
                        className="text-lg font-semibold text-gray-900 hover:underline"
                      >
                        {review.entity.name}
                      </Link>

                      <p className="mt-1 text-sm text-gray-500">
                        {review.entity.category?.name}
                        {review.entity.location
                          ? `${review.entity.category ? ' • ' : ''}${review.entity.location}`
                          : ''}
                      </p>
                    </>
                  ) : (
                    <strong>Business</strong>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <time
                    dateTime={review.createdAt}
                    className="text-sm text-gray-500"
                  >
                    {new Date(
                      review.createdAt,
                    ).toLocaleDateString()}
                  </time>
                  {optionsMenu}
                </div>
              </div>

              <div className="mt-3 text-sm">
                <span>{'⭐'.repeat(review.rating)}</span>
              </div>
            </>
          )}

          {review.offering && (
            <span className="mt-1 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              {review.offering.name}
            </span>
          )}

          <p
            className={`whitespace-pre-wrap ${
              variant === 'profile'
                ? 'mt-4 text-gray-700'
                : 'mt-3'
            }`}
          >
            {review.content}
          </p>

          {review.media && review.media.length > 0 && (
            <PhotoGrid photos={review.media} />
          )}

          <div className="mt-4 flex items-center gap-6 border-t pt-3">
            <ReactionButton reviewId={review.id} />

            

            <button
              type="button"
              onClick={() => setCommentsOpen((open) => !open)}
              className="text-sm font-medium text-gray-500 hover:underline"
            >
              💬 Comments
            </button>

            <ShareButton reviewId={review.id} />

            {olderReviews.length > 0 && (
              <button
                type="button"
                onClick={() => setOlderOpen((open) => !open)}
                className="text-sm font-medium text-gray-500 hover:underline"
              >
                {olderOpen
                  ? 'Hide older reviews'
                  : `more... (${olderReviews.length})`}
              </button>
            )}
          </div>

          {commentsOpen && (
            <CommentSection
              reviewId={review.id}
              reviewEntityId={entityId}
            />
          )}

          {olderOpen && olderReviews.length > 0 && (
            <div className="mt-4 space-y-3 border-t pt-3">
              {olderReviews.map((old) => (
                <div
                  key={old.id}
                  className="rounded-lg bg-gray-50 p-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-gray-400">
                      Old review
                    </span>

                    <span className="text-sm">⭐ {old.rating}</span>
                  </div>

                  <p className="mt-2 text-sm text-gray-600">
                    {old.content}
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    {new Date(old.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </article>
  );
}
