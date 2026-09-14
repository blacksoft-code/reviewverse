'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';

import {
  claimBusiness,
  getEntityMemberships,
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
  | 'has-other-role'
  // NEW: এই business-এর ইতিমধ্যে একজন owner আছে,
  // কিন্তু সেটা এই viewer না
  | 'already-owned-by-other';

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

      // NEW: viewer login করা থাকুক বা না থাকুক, business-টার
      // আদৌ owner আছে কিনা সেটা সবার আগে চেক করা হচ্ছে
      let entityHasOwner = false;

      try {
        const membershipsRes =
          await getEntityMemberships(entityId);
        entityHasOwner = membershipsRes.data.some(
          (m) => m.role === 'OWNER',
        );
      } catch {
        // চেক ব্যর্থ হলেও নিচের normal flow চলবে
      }

      if (!user) {
        setStatus(
          entityHasOwner
            ? 'already-owned-by-other'
            : 'not-logged-in',
        );
        return;
      }

      try {
        const [membershipsRes, claimsRes] =
          await Promise.all([
            getMyMemberships(),
            getMyClaims(),
          ]);

        const myMembership = membershipsRes.data.find(
          (m) => m.entityId === entityId,
        );

        if (myMembership) {
          setStatus(
            myMembership.role === 'OWNER'
              ? 'owner'
              : 'has-other-role',
          );
          return;
        }

        // এই viewer-এর নিজের membership নেই, কিন্তু business-এর
        // অন্য কেউ owner হয়ে গেছে — claim বাটন দেখানো ঠিক না
        if (entityHasOwner) {
          setStatus('already-owned-by-other');
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
        setStatus(
          entityHasOwner
            ? 'already-owned-by-other'
            : 'claimable',
        );
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

  // NEW: অন্য কারো owned business — claim বাটনই দেখাবে না
  if (status === 'already-owned-by-other') {
    return (
      <span className="rounded-lg border px-5 py-2.5 text-sm font-medium text-gray-400">
         Claimed ✅
      </span>
    );
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