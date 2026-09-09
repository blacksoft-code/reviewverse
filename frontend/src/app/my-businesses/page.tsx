'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';

import {
  EntityClaim,
  EntityMembership,
  getMyClaims,
  getMyMemberships,
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

export default function MyBusinessesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [memberships, setMemberships] = useState<
    EntityMembership[]
  >([]);

  const [claims, setClaims] = useState<EntityClaim[]>(
    [],
  );

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

    async function loadData() {
      try {
        const [membershipsRes, claimsRes] =
          await Promise.all([
            getMyMemberships(),
            getMyClaims(),
          ]);

        setMemberships(membershipsRes.data);
        setClaims(claimsRes.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load your businesses',
        );
      } finally {
        setLoading(false);
      }
    }

    loadData();
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
      <div className="mx-auto max-w-4xl">
        <h1 className="text-3xl font-bold">
          My Businesses
        </h1>

        <p className="mt-2 text-gray-600">
          Businesses you manage and claims you have
          submitted.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* ================================= */}
        {/* MEMBERSHIPS */}
        {/* ================================= */}

        <section className="mt-8">
          <h2 className="text-xl font-semibold">
            Businesses I Manage
          </h2>

          {memberships.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              You don&apos;t manage any business yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {memberships.map((membership) => (
                <Link
                  key={membership.id}
                  href={`/entities/${membership.entity?.slug}`}
                  className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium">
                      {membership.entity?.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      Role: {membership.role}
                    </p>
                  </div>

                  <span className="text-sm text-gray-400">
                    →
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* ================================= */}
        {/* CLAIMS */}
        {/* ================================= */}

        <section className="mt-10">
          <h2 className="text-xl font-semibold">
            My Claims
          </h2>

          {claims.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500">
              You haven&apos;t claimed any business yet.
            </p>
          ) : (
            <div className="mt-4 space-y-3">
              {claims.map((claim) => (
                <div
                  key={claim.id}
                  className="flex items-center justify-between rounded-lg border p-4"
                >
                  <div>
                    <p className="font-medium">
                      {claim.entity?.name}
                    </p>

                    <p className="text-sm text-gray-500">
                      Submitted on{' '}
                      {new Date(
                        claim.createdAt,
                      ).toLocaleDateString()}
                    </p>
                  </div>

                  <ClaimStatusBadge
                    status={claim.status}
                  />
                </div>
              ))}
            </div>
          )}
        </section>

        <div className="mt-10">
          <Link
            href="/add-business"
            className="text-sm font-medium underline"
          >
            + Add a new business
          </Link>
        </div>
      </div>
    </main>
  );
}