'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';

// Personal (user) settings — profile settings এখানে পরে যোগ হবে।
export default function SettingsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  if (loading || !user) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">Settings</h1>

        <p className="mt-2 text-gray-600">
          Settings for {user.name}.
        </p>

        <div className="mt-8 space-y-3">
          <Link
            href="/settings/claims"
            className="flex items-center justify-between rounded-lg border p-4 hover:bg-gray-50"
          >
            <span>
              <span className="block font-medium">
                Business claims
              </span>
              <span className="text-sm text-gray-500">
                Track the businesses you asked to manage
              </span>
            </span>
            <span className="text-gray-400">›</span>
          </Link>
        </div>
      </div>
    </main>
  );
}
