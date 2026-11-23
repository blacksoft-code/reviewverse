'use client';

import { useEffect, useRef, useState } from 'react';
import { useConfirm } from '@/components/common/ConfirmDialog';
import UserAvatar from '@/components/common/UserAvatar';
import { getAvatarUrl } from '@/lib/avatar';
import Link from 'next/link';

import PhotoGrid from '@/components/media/PhotoGrid';
import ReactionButton from '@/components/reviews/ReactionButton';
import CommentSection from '@/components/reviews/CommentSection';
import ShareButton from '@/components/shares/ShareButton';
import ReviewPhotoEditor, {
  PhotoEdits,
} from '@/components/reviews/ReviewPhotoEditor';
import {
  Review,
  ReviewMedia,
  deleteReview,
  updateReview,
} from '@/services/review.service';
import {
  deleteMedia,
  uploadImages,
} from '@/services/media.service';

type ReviewCardProps = {
  // group-এর latest review
  review: Review;
  // একই (user + offering)-এর পুরনো review ("more..." এর নিচে)
  olderReviews: Review[];
  // 'entity'  = business-এর page (review-এর লেখকের নাম দেখায়)
  // 'profile' = user-এর profile (কোন business-এর review সেটা দেখায়)
  // 'feed'    = home feed (লেখক আর business দুটোই link সহ দেখায়)
  variant: 'entity' | 'profile' | 'feed';
  currentUserId?: string | null;
  // Review যার লেখা তার id — profile-এ সব review ঐ profile-এর মালিকের, তাই
  // review-তে userId না এলেও ⋮ ঠিকমতো দেখায়
  ownerId?: string;
  // CommentSection-এর জন্য — এই review যে business-এর
  entityId: string;
  // Notification link থেকে এলে comment খোলা অবস্থায় আসে
  autoOpenComments?: boolean;
  onUpdated: (updated: Review) => void;
  onDeleted: (reviewId: string, promoted: Review | null) => void;
};

// একটা review card — Entity page, User profile আর Home feed তিন জায়গায় এটাই
// ব্যবহার হয়। ⋮ menu (Edit / Delete), rating, offering, ছবি, reaction/comment/share
// আর পুরনো review ("more...") সবই এখানে — এক জায়গায় বদলালে সব জায়গায় বদলায়।
export default function ReviewCard({
  review,
  olderReviews,
  variant,
  currentUserId,
  ownerId,
  entityId,
  autoOpenComments = false,
  onUpdated,
  onDeleted,
}: ReviewCardProps) {
  // শুধু নিজের review, আর শুধু latest version (পুরনো version edit করা যায় না)
  const isOwner =
    !!currentUserId &&
    currentUserId === (review.userId ?? ownerId) &&
    review.isLatest !== false;

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const [isEditing, setIsEditing] = useState(false);
  const [editingRating, setEditingRating] = useState(5);
  const [editingContent, setEditingContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Edit-এর সময় ছবির পরিবর্তন — আসল delete/upload হয় Save চাপলে
  const [photoEdits, setPhotoEdits] = useState<PhotoEdits>({
    removedIds: [],
    newFiles: [],
  });
  const [editError, setEditError] = useState('');
  // কিছু ছবির কাজ ব্যর্থ হলে editor-কে নতুন করে সাজানোর জন্য
  const [editorKey, setEditorKey] = useState(0);

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
    setPhotoEdits({ removedIds: [], newFiles: [] });
    setEditError('');
  }

  function cancelEditing() {
    setIsEditing(false);
    setEditingRating(5);
    setEditingContent('');
    setPhotoEdits({ removedIds: [], newFiles: [] });
    setEditError('');
  }

  async function handleUpdate() {
    setIsLoading(true);
    setEditError('');

    try {
      // ১) লেখা/rating — বদলালে তবেই call
      const textChanged =
        editingRating !== review.rating ||
        editingContent !== review.content;

      const updatedFields = textChanged
        ? (
            await updateReview(review.id, {
              rating: editingRating,
              content: editingContent,
            })
          ).data
        : null;

      // ২) ছবি — আগে মোছা, তারপর নতুন upload
      let media: ReviewMedia[] = review.media ?? [];
      const problems: string[] = [];

      const { removedIds, newFiles } = photoEdits;

      if (removedIds.length > 0) {
        const results = await Promise.allSettled(
          removedIds.map((id) => deleteMedia(id)),
        );

        const deletedIds = removedIds.filter(
          (_, i) => results[i].status === 'fulfilled',
        );

        media = media.filter((m) => !deletedIds.includes(m.id));

        const failedCount =
          removedIds.length - deletedIds.length;

        if (failedCount > 0) {
          problems.push(
            `${failedCount} photo${failedCount > 1 ? 's' : ''} could not be removed`,
          );
        }
      }

      if (newFiles.length > 0) {
        try {
          const uploaded = await uploadImages(
            newFiles,
            'REVIEW',
            review.id,
          );

          media = [
            ...media,
            ...uploaded.map((m) => ({ id: m.id, url: m.url })),
          ];
        } catch (uploadError) {
          problems.push(
            uploadError instanceof Error
              ? uploadError.message
              : 'New photos could not be uploaded',
          );
        }
      }

      onUpdated({
        ...review,
        ...(updatedFields ?? {}),
        user: review.user,
        entity: review.entity,
        offering: review.offering,
        media,
      });

      if (problems.length === 0) {
        cancelEditing();
        return;
      }

      // কিছু কাজ ব্যর্থ — edit খোলা রেখে জানাই, editor আসল অবস্থা থেকে নতুন করে শুরু
      setPhotoEdits({ removedIds: [], newFiles: [] });
      setEditorKey((key) => key + 1);
      setEditError(
        `Review saved, but ${problems.join('; ')}. Please try again.`,
      );
    } catch (error) {
      console.error(error);
      setEditError(
        error instanceof Error
          ? error.message
          : 'Could not save your changes.',
      );
    } finally {
      setIsLoading(false);
    }
  }

  const { confirm, confirmDialog } = useConfirm();

  async function handleDelete() {
    setMenuOpen(false);

    const confirmed = await confirm({
      title: 'Delete this review?',
      message: 'This review will be permanently removed.',
      confirmLabel: 'Delete',
      danger: true,
    });

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
        className="flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-[#6e6e73] transition hover:bg-[#F6F9FC] disabled:opacity-50"
      >
        ⋮
      </button>

      {menuOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-2xl bg-white py-1 text-[#1d1d1f] shadow-[0_8px_30px_rgba(0,0,0,0.15)] ring-1 ring-black/5"
        >
          <button
            type="button"
            role="menuitem"
            onClick={startEditing}
            className="block w-full px-4 py-2.5 text-left text-sm hover:bg-[#F6F9FC]"
          >
            Edit
          </button>

          <button
            type="button"
            role="menuitem"
            onClick={handleDelete}
            className="block w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-[#F6F9FC]"
          >
            Delete
          </button>
        </div>
      )}
    </div>
  );

  // তিনটা variant-এই একই সাদা, বড় গোল কোণের card।
  // Facebook post-এর মতো — parent-এর পুরো চওড়া নেয়। Feed আর profile-এ বড় screen-এ
  // সর্বোচ্চ 680px হয়ে মাঝখানে বসে; Entity page-এ ঐ page-এর বাকি card-এর সাথে
  // মিলিয়ে পুরো চওড়াই থাকে। মোবাইলে ভেতরের ফাঁকা কম (p-4)।
  const containerClass = `w-full rounded-2xl bg-white p-4 text-[#1d1d1f] shadow-[0_4px_24px_rgba(91,155,255,0.12)] ring-1 ring-black/[0.04] transition-shadow sm:rounded-3xl sm:p-6 ${
    variant === 'entity' ? '' : 'mx-auto max-w-[680px]'
  }`;

  const fieldClass =
    'w-full rounded-2xl bg-[#F6F9FC] px-4 py-3 text-[#1d1d1f] outline-none focus:ring-2 focus:ring-[#5B9BFF]/40';

  return (
    <article id={`review-${review.id}`} className={containerClass}>
      {confirmDialog}
      {isEditing ? (
        <>
          <select
            value={editingRating}
            onChange={(event) =>
              setEditingRating(Number(event.target.value))
            }
            className={`${fieldClass} sm:w-auto`}
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
            className={`${fieldClass} mt-3 resize-none`}
          />

          <ReviewPhotoEditor
            key={editorKey}
            existingPhotos={review.media ?? []}
            disabled={isLoading}
            onChange={setPhotoEdits}
          />

          {editError && (
            <p className="mt-3 rounded-2xl bg-red-50 px-4 py-2 text-sm text-red-600">
              {editError}
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <button
              type="button"
              disabled={isLoading}
              onClick={handleUpdate}
              className="flex-1 rounded-full bg-[#5B9BFF] px-5 py-2 text-sm sm:flex-none font-medium text-white transition hover:bg-[#4a8cf5] disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>

            <button
              type="button"
              disabled={isLoading}
              onClick={cancelEditing}
              className="flex-1 rounded-full bg-[#F6F9FC] px-5 py-2 text-sm sm:flex-none font-medium text-[#1d1d1f] transition hover:bg-[#E6F4FD] disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </>
      ) : (
        <>
          {variant !== 'profile' ? (
            <>
              <div className="flex items-center justify-between gap-3">
                {/* Feed আর entity page — দুই জায়গাতেই reviewer-এর নামে click করলে
                    তার profile-এ যায় */}
                <Link
                  href={`/profile/${encodeURIComponent(review.userId)}`}
                  className={`flex min-w-0 items-center gap-2 hover:underline ${
                    variant === 'feed' ? 'font-medium' : 'font-bold'
                  }`}
                >
                  <UserAvatar
                    name={review.user?.name ?? 'User'}
                    url={getAvatarUrl(review.user)}
                  />
                  <span className="truncate">
                    {review.user?.name ?? 'User'}
                  </span>
                </Link>

                <div className="flex shrink-0 items-center gap-1">
                  <span className="rounded-full bg-[#FFF6E5] px-3 py-1 text-sm font-medium">
                    ⭐ {review.rating}
                  </span>
                  {optionsMenu}
                </div>
              </div>

              {variant === 'feed' && review.entity && (
                <Link
                  href={`/entities/${encodeURIComponent(review.entity.slug)}`}
                  className="mt-2 flex min-w-0 items-center gap-2 text-sm text-[#6e6e73] hover:underline"
                >
                  <UserAvatar
                    name={review.entity.name}
                    url={review.entity.logo}
                    size="sm"
                  />
                  <span className="truncate">
                    {review.entity.name}
                  </span>
                </Link>
              )}
            </>
          ) : (
            <>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  {review.entity ? (
                    <>
                      <Link
                        href={`/entities/${review.entity.slug}`}
                        className="flex min-w-0 items-center gap-2 text-base font-semibold text-[#1d1d1f] hover:underline sm:text-lg"
                      >
                        <UserAvatar
                          name={review.entity.name}
                          url={review.entity.logo}
                        />
                        <span className="truncate">
                          {review.entity.name}
                        </span>
                      </Link>

                      <p className="mt-1 text-sm text-[#6e6e73]">
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

                <div className="flex shrink-0 items-center gap-1">
                  <time
                    dateTime={review.createdAt}
                    className="rounded-full bg-[#F6F9FC] px-3 py-1 text-xs text-[#6e6e73]"
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
            <span className="mt-2 inline-block rounded-full bg-[#E6F4FD] px-3 py-1 text-xs font-medium text-[#2F6FDB]">
              {review.offering.name}
            </span>
          )}

          <p
            className={`whitespace-pre-wrap leading-6 ${
              variant === 'profile'
                ? 'mt-4 text-[#3a3a3c]'
                : variant === 'feed'
                  ? 'mt-3 text-sm'
                  : 'mt-3'
            }`}
          >
            {review.content}
          </p>

          {review.media && review.media.length > 0 && (
            <PhotoGrid photos={review.media} />
          )}

          <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-black/5 pt-3">
            <ReactionButton reviewId={review.id} />

            <button
              type="button"
              onClick={() => setCommentsOpen((open) => !open)}
              className="text-sm font-medium text-[#6e6e73] hover:text-[#1d1d1f] hover:underline"
            >
              💬 Comments
            </button>

            <ShareButton reviewId={review.id} />

            {olderReviews.length > 0 && (
              <button
                type="button"
                onClick={() => setOlderOpen((open) => !open)}
                className="text-sm font-medium text-[#6e6e73] hover:text-[#1d1d1f] hover:underline"
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
            <div className="mt-4 space-y-3 border-t border-black/5 pt-3">
              {olderReviews.map((old) => (
                <div
                  key={old.id}
                  className="rounded-2xl bg-[#F6F9FC] p-4"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-[#8e8e93]">
                      Old review
                    </span>

                    <span className="text-sm">⭐ {old.rating}</span>
                  </div>

                  <p className="mt-2 text-sm text-[#6e6e73]">
                    {old.content}
                  </p>

                  <p className="mt-1 text-xs text-[#8e8e93]">
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