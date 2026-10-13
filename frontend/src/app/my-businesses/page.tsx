'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';

import {
  EntityMembership,
  getMyMemberships,
} from '@/services/entity-membership.service';

// শুধু entry point: আমি যেসব business manage করি তার list।
// Post/offering/info সব manage হয় business dashboard-এ;
// claim-এর status দেখা যায় Settings → Business claims-এ।
export default function MyBusinessesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [memberships, setMemberships] = useState<
    EntityMembership[]
  >([]);
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
        const res = await getMyMemberships();
        setMemberships(res.data);
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
        <h1 className="text-3xl font-bold">My Businesses</h1>

        <p className="mt-2 text-gray-600">
          Open a business dashboard to manage its posts, services,
          info and more.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {memberships.length === 0 ? (
          <p className="mt-8 text-sm text-gray-500">
            You don&apos;t manage any business yet.
          </p>
        ) : (
          <div className="mt-8 space-y-3">
            {memberships.map((membership) => (
              <div
                key={membership.id}
                className="flex items-center justify-between rounded-lg border p-4"
              >
                <div>
                  <p className="font-medium">
                    {membership.entity?.name}
                  </p>
                  <p className="text-sm text-gray-500">
                    Role: {membership.role}
                  </p>
                </div>

                <Link
                  href={`/business/${membership.entityId}`}
                  className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                >
                  Open dashboard
                </Link>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 flex items-center gap-6 text-sm font-medium">
          <Link href="/add-business" className="underline">
            + Add a new business
          </Link>

          <Link href="/settings/claims" className="underline">
            My business claims
          </Link>
        </div>
      </div>
    </main>
  );
}
