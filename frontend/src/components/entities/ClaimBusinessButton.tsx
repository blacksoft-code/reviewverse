'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';

import {
  claimBusiness,
  EntityRole,
  getEntityMemberships,
  getMyClaims,
  getMyMemberships,
} from '@/services/entity-membership.service';

type ClaimBusinessButtonProps = {
  entityId: string;
};

export type ClaimStatus =
  | 'checking'
  | 'not-logged-in'
  | 'claimable'
  | 'pending'
  | 'owner'
  | 'has-other-role'
  // এই business-এর ইতিমধ্যে একজন owner আছে,
  // কিন্তু সেটা এই viewer না
  | 'already-owned-by-other';

// Claim-সংক্রান্ত সব তথ্য এক জায়গায় — Entity header (উপরের "Claimed / Not claimed"
// আর ⋯ menu-র "Claim this business") আর নিচের বাটন দুটোই এটা ব্যবহার করে
export function useClaimStatus(entityId: string) {
  const { user, loading: authLoading } = useAuth();

  const [status, setStatus] =
    useState<ClaimStatus>('checking');

  // business-টার কোনো OWNER আছে কিনা (জানা না গেলে null)
  const [hasOwner, setHasOwner] = useState<boolean | null>(
    null,
  );

  // এই viewer এই business-এর member হলে তার role
  const [myRole, setMyRole] = useState<EntityRole | null>(
    null,
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadStatus() {
      if (authLoading) {
        return;
      }

      // viewer login করা থাকুক বা না থাকুক, business-টার
      // আদৌ owner আছে কিনা সেটা সবার আগে চেক করা হচ্ছে
      let entityHasOwner = false;
      let ownerKnown = false;

      try {
        const membershipsRes =
          await getEntityMemberships(entityId);
        entityHasOwner = membershipsRes.data.some(
          (m) => m.role === 'OWNER',
        );
        ownerKnown = true;
      } catch {
        // চেক ব্যর্থ হলেও নিচের normal flow চলবে
      }

      setHasOwner(ownerKnown ? entityHasOwner : null);
      setMyRole(null);

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
          setMyRole(myMembership.role);

          if (myMembership.role === 'OWNER') {
            setHasOwner(true);
            setStatus('owner');
          } else {
            setStatus('has-other-role');
          }

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

  async function submitClaim() {
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

  return {
    status,
    hasOwner,
    myRole,
    submitting,
    error,
    submitClaim,
  };
}

export type ClaimState = ReturnType<typeof useClaimStatus>;

// আগের মতোই একটা আলাদা বাটন হিসেবে ব্যবহার করা যাবে (এখন Entity header এটা
// ব্যবহার করে না — সেখানে "Claim this business" ⋯ menu-র ভেতরে)
export default function ClaimBusinessButton({
  entityId,
}: ClaimBusinessButtonProps) {
  const { status, submitting, error, submitClaim } =
    useClaimStatus(entityId);

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

  // অন্য কারো owned business — claim বাটনই দেখাবে না
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
        onClick={submitClaim}
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