'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';

import {
  EntityClaim,
  getMyClaims,
} from '@/services/entity-membership.service';

function ClaimStatusBadge({
  status,
}: {
  status: EntityClaim['status'];
}) {
  const styles: Record<EntityClaim['status'], string> = {
    PENDING: 'bg-yellow-100 text-yellow-700',
    APPROVED: 'bg-green-100 text-green-700',
    REJECTED: 'bg-red-100 text-red-700',
  };

  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${styles[status]}`}
    >
      {status}
    </span>
  );
}

// Settings → Business claims
// Claim একটা personal কাজ (business-এর member হওয়ার আগের ধাপ), তাই
// এটা business dashboard-এ না, account settings-এ।
export default function BusinessClaimsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [claims, setClaims] = useState<EntityClaim[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    async function loadClaims() {
      try {
        const res = await getMyClaims();
        setClaims(res.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load your claims',
        );
      } finally {
        setLoading(false);
      }
    }

    loadClaims();
  }, [authLoading, user, router]);

  if (authLoading || loading) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm text-gray-500">Settings</p>

        <h1 className="mt-1 text-3xl font-bold">
          Business claims
        </h1>

        <p className="mt-2 text-gray-600">
          Claims you have submitted to manage a business, and
          their status.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {claims.length === 0 ? (
          <p className="mt-8 text-sm text-gray-500">
            You haven&apos;t claimed any business yet.
          </p>
        ) : (
          <div className="mt-8 space-y-3">
            {claims.map((claim) => (
              <div
                key={claim.id}
                className="flex items-center justify-between gap-4 rounded-lg border p-4"
              >
                <div className="min-w-0">
                  {claim.entity?.slug ? (
                    <Link
                      href={`/entities/${claim.entity.slug}`}
                      className="font-medium hover:underline"
                    >
                      {claim.entity.name}
                    </Link>
                  ) : (
                    <p className="font-medium">
                      {claim.entity?.name}
                    </p>
                  )}

                  <p className="text-sm text-gray-500">
                    Submitted on{' '}
                    {new Date(
                      claim.createdAt,
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <ClaimStatusBadge status={claim.status} />

                  {claim.status === 'APPROVED' && (
                    <Link
                      href={`/business/${claim.entityId}`}
                      className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-gray-50"
                    >
                      Open dashboard
                    </Link>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 text-sm font-medium">
          <Link href="/my-businesses" className="underline">
            ← My businesses
          </Link>
        </div>
      </div>
    </main>
  );
}
