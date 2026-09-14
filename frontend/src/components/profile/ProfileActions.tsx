'use client';

import { useEffect, useRef, useState } from 'react';
import { getProfile } from '@/services/auth.service';

import {
  acceptFriendRequest,
  blockUser,
  cancelFriendRequest,
  followUser,
  getUserRelationship,
  sendFriendRequest,
  unfollowUser,
  unblockUser,
  unfriendUser,
} from '@/services/user.service';

type ProfileActionsProps = {
  userId: string;
  // NEW: confirm modal-এ "Unfriend {name}" দেখানোর জন্য
  userName: string;
};

export default function ProfileActions({
  userId,
  userName,
}: ProfileActionsProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFriend, setIsFriend] = useState(false);

  // NEW: "Friends ▾" ড্রপডাউন খোলা/বন্ধ
  const [friendsMenuOpen, setFriendsMenuOpen] =
    useState(false);

  // NEW: Unfriend confirmation modal
  const [showUnfriendModal, setShowUnfriendModal] =
    useState(false);

  const friendsMenuRef = useRef<HTMLDivElement>(null);

  const [friendRequestId, setFriendRequestId] =
    useState<string | null>(null);

  const [friendRequestStatus, setFriendRequestStatus] =
    useState<
      'PENDING' | 'ACCEPTED' | 'REJECTED' | null
    >(null);

  const [
    friendRequestDirection,
    setFriendRequestDirection,
  ] = useState<'SENT' | 'RECEIVED' | null>(null);

  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByTarget, setIsBlockedByTarget] =
    useState(false);

  const [loading, setLoading] = useState<
    string | null
  >(null);
  const [initialLoading, setInitialLoading] =
    useState(true);
  const [isOwnProfile, setIsOwnProfile] =
    useState(false);

  // ───── বাইরে ক্লিক করলে dropdown বন্ধ ─────
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        friendsMenuRef.current &&
        !friendsMenuRef.current.contains(
          e.target as Node,
        )
      ) {
        setFriendsMenuOpen(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    );
    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      );
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadCurrentUser() {
      try {
        const response = await getProfile();
        if (!mounted) return;
        setIsOwnProfile(response.data.id === userId);
      } catch {
        if (mounted) setIsOwnProfile(false);
      }
    }

    async function loadRelationship() {
      try {
        const response = await getUserRelationship(
          userId,
        );
        if (!mounted) return;

        setIsFollowing(response.data.isFollowing);
        setIsFriend(response.data.isFriend);
        setFriendRequestId(
          response.data.friendRequestId,
        );
        setFriendRequestStatus(
          response.data.friendRequestStatus,
        );
        setFriendRequestDirection(
          response.data.friendRequestDirection,
        );
        setIsBlocked(response.data.isBlocked);
        setIsBlockedByTarget(
          response.data.isBlockedByTarget,
        );
      } catch (error) {
        if (mounted) {
          alert(
            error instanceof Error
              ? error.message
              : 'Something went wrong',
          );
        }
      } finally {
        if (mounted) setInitialLoading(false);
      }
    }

    loadCurrentUser();
    loadRelationship();

    return () => {
      mounted = false;
    };
  }, [userId]);

  const handleFollow = async () => {
    try {
      setLoading('follow');

      if (isFollowing) {
        await unfollowUser(userId);
        setIsFollowing(false);
      } else {
        await followUser(userId);
        setIsFollowing(true);
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      );
    } finally {
      setLoading(null);
    }
  };

  // NEW: dropdown-এর ভেতরের Unfollow/Follow — action শেষে menu বন্ধ হয়ে যাবে
  const handleFollowFromMenu = async () => {
    await handleFollow();
    setFriendsMenuOpen(false);
  };

  const handleAcceptFriendRequest = async () => {
    try {
      setLoading('friend');
      if (!friendRequestId) return;

      await acceptFriendRequest(friendRequestId);

      setIsFriend(true);
      setFriendRequestStatus(null);
      setFriendRequestDirection(null);
      setFriendRequestId(null);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      );
    } finally {
      setLoading(null);
    }
  };

  const handleFriendRequest = async () => {
    try {
      setLoading('friend');

      if (
        friendRequestStatus === 'PENDING' &&
        friendRequestDirection === 'SENT' &&
        friendRequestId
      ) {
        await cancelFriendRequest(friendRequestId);
        setFriendRequestId(null);
        setFriendRequestStatus(null);
        setFriendRequestDirection(null);
        return;
      }

      const response = await sendFriendRequest(userId);

      setFriendRequestId(response.data.id);
      setFriendRequestStatus('PENDING');
      setFriendRequestDirection('SENT');
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      );
    } finally {
      setLoading(null);
    }
  };

  const handleBlock = async () => {
    try {
      setLoading('block');

      if (isBlocked) {
        await unblockUser(userId);
        setIsBlocked(false);
      } else {
        await blockUser(userId);
        setIsBlocked(true);
        setIsFollowing(false);
        setIsFriend(false);
        setFriendRequestId(null);
        setFriendRequestStatus(null);
        setFriendRequestDirection(null);
      }
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      );
    } finally {
      setLoading(null);
    }
  };

  const handleUnfriend = async () => {
    try {
      setLoading('friend');
      await unfriendUser(userId);

      setIsFriend(false);
      setShowUnfriendModal(false);
      setFriendsMenuOpen(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      );
    } finally {
      setLoading(null);
    }
  };

  if (initialLoading) {
    return (
      <div className="mt-5 flex flex-wrap gap-3">
        <div className="h-10 w-24 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-10 w-28 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-10 w-20 animate-pulse rounded-lg bg-gray-200" />
      </div>
    );
  }

  const actionsDisabled =
    loading !== null || isBlockedByTarget;

  return (
    <>
      {!isOwnProfile && (
        <div className="mt-5 flex flex-wrap gap-3">
          {/* ───────────────────────────────
              friend হলে: একটাই "Friends ▾" বাটন,
              dropdown-এ Unfollow/Follow + Unfriend
             ─────────────────────────────── */}
          {isFriend ? (
            <div
              ref={friendsMenuRef}
              className="relative"
            >
              <button
                type="button"
                onClick={() =>
                  setFriendsMenuOpen((prev) => !prev)
                }
                disabled={actionsDisabled}
                className="rounded-lg border border-green-300 bg-white px-5 py-2 text-sm font-medium text-green-700 transition hover:bg-green-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Friends ▾
              </button>

              {friendsMenuOpen && (
                <div className="absolute left-0 z-50 mt-2 w-48 rounded-lg border bg-white py-1 shadow-lg">
                  <button
                    type="button"
                    onClick={handleFollowFromMenu}
                    disabled={loading === 'follow'}
                    className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    {loading === 'follow'
                      ? 'Loading...'
                      : isFollowing
                        ? 'Unfollow'
                        : 'Follow'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setFriendsMenuOpen(false);
                      setShowUnfriendModal(true);
                    }}
                    className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                  >
                    Unfriend
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* বন্ধু না হলে — আগের মতোই আলাদা Follow/Unfollow বাটন */}
              <button
                type="button"
                onClick={handleFollow}
                disabled={actionsDisabled || isBlocked}
                className="rounded-lg bg-black px-5 py-2 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading === 'follow'
                  ? 'Loading...'
                  : isFollowing
                    ? 'Unfollow'
                    : 'Follow'}
              </button>

              {friendRequestStatus === 'PENDING' &&
              friendRequestDirection === 'RECEIVED' ? (
                <button
                  type="button"
                  onClick={handleAcceptFriendRequest}
                  disabled={actionsDisabled}
                  className="rounded-lg bg-green-600 px-5 py-2 text-sm font-medium text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading === 'friend'
                    ? 'Accepting...'
                    : 'Accept Request'}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFriendRequest}
                  disabled={actionsDisabled || isBlocked}
                  className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading === 'friend'
                    ? friendRequestStatus === 'PENDING' &&
                      friendRequestDirection === 'SENT'
                      ? 'Cancelling...'
                      : 'Sending...'
                    : friendRequestStatus === 'PENDING' &&
                      friendRequestDirection === 'SENT'
                      ? 'Cancel Request'
                      : 'Add Friend'}
                </button>
              )}
            </>
          )}

          <button
            type="button"
            onClick={handleBlock}
            disabled={loading !== null || isBlockedByTarget}
            className="rounded-lg border border-red-300 bg-white px-5 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === 'block'
              ? 'Loading...'
              : isBlocked
                ? 'Unblock'
                : 'Block'}
          </button>
        </div>
      )}

      {/* ───────────────────────────────
          NEW: Unfriend confirmation modal
         ─────────────────────────────── */}
      {showUnfriendModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowUnfriendModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm rounded-xl bg-white p-5 shadow-xl"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">
                Unfriend {userName}
              </h3>

              <button
                type="button"
                onClick={() =>
                  setShowUnfriendModal(false)
                }
                className="text-xl leading-none text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <p className="mt-3 text-sm text-gray-600">
              Are you sure you want to remove{' '}
              {userName} as your friend?
            </p>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setShowUnfriendModal(false)
                }
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleUnfriend}
                disabled={loading === 'friend'}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {loading === 'friend'
                  ? 'Removing...'
                  : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}