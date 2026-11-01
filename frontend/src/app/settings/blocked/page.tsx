'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import BlockedContent from '@/components/profile/BlockedContent';

// Settings → Blocked
// আগে Friends tab-এর ভেতরে ছিল; এখন এখানে। People আর Businesses দুই অংশই,
// আর আগের সব interaction (যেমন Unblock) এখানেও আছে।
export default function BlockedSettingsPage() {
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
        <p className="text-sm text-gray-500">Settings</p>

        <h1 className="mt-1 text-3xl font-bold">Blocked</h1>

        <p className="mt-2 text-gray-600">
          People and businesses you have blocked.
        </p>

        <BlockedContent />

        <div className="mt-10 text-sm font-medium">
          <Link href="/settings" className="underline">
            ← Settings
          </Link>
        </div>
      </div>
    </main>
  );
}
