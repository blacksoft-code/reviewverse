'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';

import {
  approveClaim,
  EntityClaim,
  getPendingClaims,
  rejectClaim,
} from '@/services/entity-membership.service';

export default function AdminClaimsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [claims, setClaims] = useState<EntityClaim[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // claimId যেটার উপর action চলছে, সেটার জন্য loading state
  const [actingOn, setActingOn] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    loadClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, router]);

  async function loadClaims() {
    try {
      setLoading(true);
      const response = await getPendingClaims();
      setClaims(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load pending claims',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(claimId: string) {
    setError('');
    setActingOn(claimId);

    try {
      await approveClaim(claimId);

      // Approve হয়ে যাওয়া claim-টা list থেকে সরিয়ে দেওয়া হচ্ছে
      setClaims((prev) =>
        prev.filter((c) => c.id !== claimId),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to approve claim',
      );
    } finally {
      setActingOn(null);
    }
  }

  async function handleReject(claimId: string) {
    setError('');
    setActingOn(claimId);

    try {
      await rejectClaim(claimId);

      setClaims((prev) =>
        prev.filter((c) => c.id !== claimId),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to reject claim',
      );
    } finally {
      setActingOn(null);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">
          Business Claims
        </h1>

        <p className="mt-2 text-gray-600">
          Review and approve business ownership claims.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        <div className="mt-8 space-y-4">
          {claims.length === 0 ? (
            <p className="text-sm text-gray-500">
              No pending claims right now.
            </p>
          ) : (
            claims.map((claim) => (
              <div
                key={claim.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">
                    {claim.entity?.name}
                  </p>

                  <p className="text-sm text-gray-500">
                    Claimed by {claim.user?.name} (
                    {claim.user?.email})
                  </p>

                  <p className="mt-1 text-xs text-gray-400">
                    Submitted{' '}
                    {new Date(
                      claim.createdAt,
                    ).toLocaleString()}
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      handleApprove(claim.id)
                    }
                    disabled={
                      actingOn === claim.id
                    }
                    className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {actingOn === claim.id
                      ? '...'
                      : 'Approve'}
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      handleReject(claim.id)
                    }
                    disabled={
                      actingOn === claim.id
                    }
                    className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50"
                  >
                    {actingOn === claim.id
                      ? '...'
                      : 'Reject'}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </main>
  );
}