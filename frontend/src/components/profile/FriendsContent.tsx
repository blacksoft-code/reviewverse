'use client';

import { useEffect, useState } from 'react';

import {
  acceptFriendRequest,
  blockUser,
  getFriends,
  getPendingFriendRequests,
  rejectFriendRequest,
  unfollowUser,
  unfriendUser,
} from '@/services/user.service';

type Friend = {
  id: string;
  name: string;
};

type FriendRequest = {
  id: string;
  sender: {
    id: string;
    name: string;
  };
};

type FriendsContentProps = {
  userId: string;
  userName: string;
};

export default function FriendsContent({
  userId,
  userName,
}: FriendsContentProps) {
  const [activeTab, setActiveTab] =
    useState<'friends' | 'requests'>('friends');

  const [friends, setFriends] =
    useState<Friend[]>([]);

  const [requests, setRequests] =
    useState<FriendRequest[]>([]);

  const [openMenu, setOpenMenu] =
    useState<string | null>(null);

  const [loading, setLoading] =
    useState<string | null>(null);

  const [loadingFriends, setLoadingFriends] =
    useState(true);

  const [loadingRequests, setLoadingRequests] =
    useState(false);

  useEffect(() => {
    async function loadFriends() {
      try {
        setLoadingFriends(true);

        const response =
          await getFriends(userId);

        setFriends(
          response.data.friends ?? [],
        );
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : 'Something went wrong',
        );
      } finally {
        setLoadingFriends(false);
      }
    }

    loadFriends();
  }, [userId]);

  const loadRequests = async () => {
    try {
      setLoadingRequests(true);

      const response =
        await getPendingFriendRequests();

      setRequests(
        response.data ?? [],
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      );
    } finally {
      setLoadingRequests(false);
    }
  };

  const handleTabChange = (
    tab: 'friends' | 'requests',
  ) => {
    setActiveTab(tab);

    if (
      tab === 'requests' &&
      requests.length === 0
    ) {
      loadRequests();
    }
  };

  const handleUnfollow = async (
    friendId: string,
  ) => {
    try {
      setLoading(friendId);

      await unfollowUser(friendId);

      setOpenMenu(null);
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

  const handleUnfriend = async (
    friendId: string,
  ) => {
    try {
      setLoading(friendId);

      await unfriendUser(friendId);

      setFriends((current) =>
        current.filter(
          (friend) => friend.id !== friendId,
        ),
      );

      setOpenMenu(null);
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

  const handleBlock = async (
    friendId: string,
  ) => {
    try {
      setLoading(friendId);

      await blockUser(friendId);

      setFriends((current) =>
        current.filter(
          (friend) => friend.id !== friendId,
        ),
      );

      setOpenMenu(null);
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

  const handleAccept = async (
    requestId: string,
  ) => {
    try {
      setLoading(requestId);

      await acceptFriendRequest(requestId);

      setRequests((current) =>
        current.filter(
          (request) => request.id !== requestId,
        ),
      );

      const response =
        await getFriends(userId);

      setFriends(
        response.data.friends ?? [],
      );
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

  const handleDelete = async (
    requestId: string,
  ) => {
    try {
      setLoading(requestId);

      await rejectFriendRequest(requestId);

      setRequests((current) =>
        current.filter(
          (request) => request.id !== requestId,
        ),
      );
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

  return (
    <section className="mx-auto max-w-5xl px-6 py-8">
      <div className="rounded-xl bg-white p-6 shadow-sm">

        <div className="border-b">
          <div className="flex gap-8">
            <button
              type="button"
              onClick={() =>
                handleTabChange('friends')
              }
              className={`pb-4 text-sm font-semibold ${
                activeTab === 'friends'
                  ? 'border-b-2 border-black text-black'
                  : 'text-gray-500'
              }`}
            >
              Your friends
            </button>

            <button
              type="button"
              onClick={() =>
                handleTabChange('requests')
              }
              className={`pb-4 text-sm font-semibold ${
                activeTab === 'requests'
                  ? 'border-b-2 border-black text-black'
                  : 'text-gray-500'
              }`}
            >
              Friend Request
            </button>
          </div>
        </div>

        {activeTab === 'friends' ? (
          <div className="mt-6">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-gray-900">
                Your friends
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                {friends.length} friends
              </p>
            </div>

            {loadingFriends ? (
              <div className="py-10 text-center text-gray-500">
                Loading friends...
              </div>
            ) : friends.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl">
                  👥
                </div>

                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  No friends yet
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  {userName} hasn't added any friends yet.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {friends.map((friend) => (
                  <div
                    key={friend.id}
                    className="flex items-center justify-between py-4"
                  >
                    <a
                      href={`/profile/${friend.id}`}
                      className="flex items-center gap-4"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-600">
                        {friend.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <span className="font-semibold text-gray-900 hover:underline">
                        {friend.name}
                      </span>
                    </a>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenMenu(
                            openMenu === friend.id
                              ? null
                              : friend.id,
                          )
                        }
                        disabled={
                          loading === friend.id
                        }
                        className="flex h-9 w-9 items-center justify-center rounded-full text-xl text-gray-500 hover:bg-gray-100"
                      >
                        ⋮
                      </button>

                      {openMenu === friend.id && (
                        <div className="absolute right-0 z-20 mt-2 w-40 rounded-lg border bg-white py-1 shadow-lg">
                          <button
                            type="button"
                            onClick={() =>
                              handleUnfollow(
                                friend.id,
                              )
                            }
                            className="block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100"
                          >
                            Unfollow
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleUnfriend(
                                friend.id,
                              )
                            }
                            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                          >
                            Unfriend
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              handleBlock(
                                friend.id,
                              )
                            }
                            className="block w-full px-4 py-2 text-left text-sm text-red-600 hover:bg-gray-100"
                          >
                            Block
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="mt-6">
            <div className="mb-5">
              <h2 className="text-2xl font-bold text-gray-900">
                Friend Requests
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                People who want to be your friend
              </p>
            </div>

            {loadingRequests ? (
              <div className="py-10 text-center text-gray-500">
                Loading requests...
              </div>
            ) : requests.length === 0 ? (
              <div className="py-12 text-center">
                <div className="text-4xl">
                  👋
                </div>

                <h3 className="mt-4 text-lg font-semibold text-gray-900">
                  No friend requests
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  You don't have any pending requests.
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {requests.map((request) => (
                  <div
                    key={request.id}
                    className="flex items-center justify-between gap-4 py-4"
                  >
                    <a
                      href={`/profile/${request.sender.id}`}
                      className="flex items-center gap-4"
                    >
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-600">
                        {request.sender.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <span className="font-semibold text-gray-900 hover:underline">
                        {request.sender.name}
                      </span>
                    </a>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleAccept(
                            request.id,
                          )
                        }
                        disabled={
                          loading === request.id
                        }
                        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                      >
                        {loading === request.id
                          ? 'Loading...'
                          : 'Confirm'}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(
                            request.id,
                          )
                        }
                        disabled={
                          loading === request.id
                        }
                        className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </section>
  );
}