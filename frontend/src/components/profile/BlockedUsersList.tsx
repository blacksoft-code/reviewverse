'use client';

import { useEffect, useState } from 'react';

import {
  BlockedUser,
  getBlockedUsers,
  unblockUser,
} from '@/services/user.service';

export default function BlockedUsersList() {
  const [blockedUsers, setBlockedUsers] =
    useState<BlockedUser[]>([]);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingId, setLoadingId] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadBlocked() {
      try {
        setLoadingList(true);

        const response = await getBlockedUsers();

        setBlockedUsers(
          response.data.blockedUsers ?? [],
        );
      } catch (error) {
        alert(
          error instanceof Error
            ? error.message
            : 'Something went wrong',
        );
      } finally {
        setLoadingList(false);
      }
    }

    loadBlocked();
  }, []);

  const handleUnblock = async (userId: string) => {
    try {
      setLoadingId(userId);

      await unblockUser(userId);

      setBlockedUsers((current) =>
        current.filter((u) => u.id !== userId),
      );
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      );
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="mt-6">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-900">
          Blocked users
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {blockedUsers.length} blocked
        </p>
      </div>

      {loadingList ? (
        <div className="py-10 text-center text-gray-500">
          Loading blocked users...
        </div>
      ) : blockedUsers.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-4xl">🚫</div>

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No blocked users
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            You haven't blocked anyone.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {blockedUsers.map((blocked) => (
            <div
              key={blocked.id}
              className="flex items-center justify-between gap-4 py-4"
            >
              <a
                href={`/profile/${blocked.id}`}
                className="flex items-center gap-4"
              >
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-600">
                  {blocked.name.charAt(0).toUpperCase()}
                </div>

                <span className="font-semibold text-gray-900 hover:underline">
                  {blocked.name}
                </span>
              </a>

              <button
                type="button"
                onClick={() => handleUnblock(blocked.id)}
                disabled={loadingId === blocked.id}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                {loadingId === blocked.id
                  ? 'Loading...'
                  : 'Unblock'}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
