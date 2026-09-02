'use client';

import { useEffect, useState } from 'react';

import {
  blockEntity,
  followEntity,
  getEntityRelationshipStatus,
  unblockEntity,
  unfollowEntity,
} from '@/services/user.service';

type EntityActionsProps = {
  entityId: string;
};

export default function EntityActions({
  entityId,
}: EntityActionsProps) {
  const [isFollowing, setIsFollowing] =
    useState(false);

  const [isBlocked, setIsBlocked] =
    useState(false);

  const [loading, setLoading] =
    useState<string | null>(null);

  async function handleFollow() {
    try {
      setLoading('follow');

      await followEntity(entityId);

      setIsFollowing(true);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleUnfollow() {
    try {
      setLoading('follow');

      await unfollowEntity(entityId);

      setIsFollowing(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleBlock() {
    try {
      setLoading('block');

      await blockEntity(entityId);

      setIsBlocked(true);
      setIsFollowing(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      );
    } finally {
      setLoading(null);
    }
  }

  async function handleUnblock() {
    try {
      setLoading('block');

      await unblockEntity(entityId);

      setIsBlocked(false);
    } catch (error) {
      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      );
    } finally {
      setLoading(null);
    }
  }

  useEffect(() => {
  async function loadStatus() {
    try {
      const result = await getEntityRelationshipStatus(entityId);

      setIsFollowing(result.data.isFollowing);
      setIsBlocked(result.data.isBlocked);
    } catch {
    }
  }

  loadStatus();
}, [entityId]);

  return (
    <div className="flex flex-wrap gap-3">
      {isBlocked ? (
        <button
          type="button"
          onClick={handleUnblock}
          disabled={loading === 'block'}
          className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
        >
          {loading === 'block'
            ? 'Loading...'
            : 'Unblock'}
        </button>
      ) : (
        <>
          <button
            type="button"
            onClick={
              isFollowing
                ? handleUnfollow
                : handleFollow
            }
            disabled={loading === 'follow'}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading === 'follow'
              ? 'Loading...'
              : isFollowing
                ? 'Unfollow'
                : 'Follow'}
          </button>

          <button
            type="button"
            onClick={handleBlock}
            disabled={loading === 'block'}
            className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            {loading === 'block'
              ? 'Loading...'
              : 'Block'}
          </button>
        </>
      )}
    </div>
  );
}