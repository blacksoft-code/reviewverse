'use client';

import { useEffect, useState } from 'react';

import {
  BlockedEntity,
  getBlockedEntities,
  unblockEntity,
} from '@/services/user.service';

export default function BlockedEntitiesList() {
  const [blockedEntities, setBlockedEntities] =
    useState<BlockedEntity[]>([]);

  const [loadingList, setLoadingList] = useState(true);
  const [loadingId, setLoadingId] =
    useState<string | null>(null);

  useEffect(() => {
    async function loadBlocked() {
      try {
        setLoadingList(true);

        const response = await getBlockedEntities();

        setBlockedEntities(
          response.data.blockedEntities ?? [],
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

  const handleUnblock = async (entityId: string) => {
    try {
      setLoadingId(entityId);

      await unblockEntity(entityId);

      setBlockedEntities((current) =>
        current.filter((e) => e.id !== entityId),
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
          Blocked businesses
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          {blockedEntities.length} blocked
        </p>
      </div>

      {loadingList ? (
        <div className="py-10 text-center text-gray-500">
          Loading blocked businesses...
        </div>
      ) : blockedEntities.length === 0 ? (
        <div className="py-12 text-center">
          <div className="text-4xl">🚫</div>

          <h3 className="mt-4 text-lg font-semibold text-gray-900">
            No blocked businesses
          </h3>

          <p className="mt-2 text-sm text-gray-500">
            You haven&apos;t blocked any business.
          </p>
        </div>
      ) : (
        <div className="divide-y">
          {blockedEntities.map((entity) => (
            <div
              key={entity.id}
              className="flex items-center justify-between gap-4 py-4"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-600">
                  {entity.name.charAt(0).toUpperCase()}
                </div>

                <div>
                  <p className="font-semibold text-gray-900">
                    {entity.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    {[entity.category?.name, entity.location]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleUnblock(entity.id)}
                disabled={loadingId === entity.id}
                className="rounded-lg border px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                {loadingId === entity.id
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
