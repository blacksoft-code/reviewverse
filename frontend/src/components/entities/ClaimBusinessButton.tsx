'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';

import {
  claimBusiness,
  getMyClaims,
  getMyMemberships,
} from '@/services/entity-membership.service';

type ClaimBusinessButtonProps = {
  entityId: string;
};

type Status =
  | 'checking'
  | 'not-logged-in'
  | 'claimable'
  | 'pending'
  | 'owner'
  | 'has-other-role';

export default function ClaimBusinessButton({
  entityId,
}: ClaimBusinessButtonProps) {
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] =
    useState<Status>('checking');

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStatus() {
      if (authLoading) {
        return;
      }

      if (!user) {
        setStatus('not-logged-in');
        return;
      }

      try {
        const [membershipsRes, claimsRes] =
          await Promise.all([
            getMyMemberships(),
            getMyClaims(),
          ]);

        const membership = membershipsRes.data.find(
          (m) => m.entityId === entityId,
        );

        if (membership) {
          setStatus(
            membership.role === 'OWNER'
              ? 'owner'
              : 'has-other-role',
          );
          return;
        }

        const claim = claimsRes.data.find(
          (c) => c.entityId === entityId,
        );

        if (claim && claim.status === 'PENDING') {
          setStatus('pending');
          return;
        }

        setStatus('claimable');
      } catch {
        // Status চেক করতে না পারলেও claim button দেখানো হবে
        setStatus('claimable');
      }
    }

    loadStatus();
  }, [entityId, user, authLoading]);

  async function handleClaim() {
    setError('');
    setSubmitting(true);

    try {
      await claimBusiness(entityId);
      setStatus('pending');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to submit claim',
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (status === 'checking') {
    return null;
  }

  if (status === 'owner') {
    return (
      <span className="rounded-lg border border-green-600 px-5 py-2.5 text-sm font-medium text-green-600">
        ✓ You manage this business
      </span>
    );
  }

  if (status === 'has-other-role') {
    return null;
  }

  if (status === 'pending') {
    return (
      <span className="rounded-lg border px-5 py-2.5 text-sm font-medium text-gray-500">
        Claim pending review
      </span>
    );
  }

  if (status === 'not-logged-in') {
    return (
      <Link
        href="/login"
        className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
      >
        Login to claim this business
      </Link>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={handleClaim}
        disabled={submitting}
        className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
      >
        {submitting
          ? 'Submitting...'
          : 'Claim this business'}
      </button>

      {error && (
        <span className="text-xs text-red-600">
          {error}
        </span>
      )}
    </div>
  );
}