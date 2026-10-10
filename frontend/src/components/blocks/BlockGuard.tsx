'use client';

import Link from 'next/link';

import { useBlocks } from '@/hooks/useBlocks';

type BlockGuardProps = {
  kind: 'user' | 'entity';
  id: string;
  children: React.ReactNode;
};

// Profile / entity page-এর চারপাশে — block থাকলে পুরো page-এর বদলে
// "এটা পাওয়া যাচ্ছে না" দেখায় (Facebook-এর মতো)
export default function BlockGuard({
  kind,
  id,
  children,
}: BlockGuardProps) {
  const { loading, hiddenUserIds, blockedEntityIds } =
    useBlocks();

  const hidden =
    kind === 'user'
      ? hiddenUserIds.has(id)
      : blockedEntityIds.has(id);

  if (hidden) {
    return (
      <main className="flex min-h-[60vh] items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
          <div className="text-4xl">🚫</div>

          <h1 className="mt-4 text-xl font-bold text-gray-900">
            This content isn&apos;t available right now
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {kind === 'user'
              ? 'This profile may be unavailable because of a block, or it may have been removed.'
              : 'You have blocked this business. Unblock it from your Friends → Blocked tab to see it again.'}
          </p>

          <Link
            href="/"
            className="mt-6 inline-block rounded-lg bg-black px-5 py-2 text-sm font-medium text-white"
          >
            Go to home
          </Link>
        </div>
      </main>
    );
  }

  // block overview আসার আগে content লুকিয়ে রাখা — blocked content
  // এক ঝলকের জন্যও যেন না দেখা যায়
  return (
    <div style={{ visibility: loading ? 'hidden' : 'visible' }}>
      {children}
    </div>
  );
}
