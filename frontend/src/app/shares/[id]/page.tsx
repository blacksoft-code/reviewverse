'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

import SharedCard from '@/components/shares/SharedCard';
import { getShare, ShareItem } from '@/services/share.service';

// Notification (share-এ reaction/comment) click করলে এখানে আসে
export default function SharePage() {
  const { id } = useParams<{ id: string }>();

  const [share, setShare] = useState<ShareItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getShare(id)
      .then((res) => setShare(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <main className="mx-auto max-w-2xl p-6">
      {loading && (
        <p className="text-sm text-gray-500">Loading…</p>
      )}

      {!loading && (notFound || !share) && (
        <div className="py-16 text-center">
          <p className="text-lg font-semibold">
            This share isn&apos;t available
          </p>
          <p className="mt-1 text-sm text-gray-500">
            It may have been deleted.
          </p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm underline"
          >
            Back to home
          </Link>
        </div>
      )}

      {share && (
        <SharedCard
          share={share}
          onDeleted={() => {
            setShare(null);
            setNotFound(true);
          }}
        />
      )}
    </main>
  );
}
