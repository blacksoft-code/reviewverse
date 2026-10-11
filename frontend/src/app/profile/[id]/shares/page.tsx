'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import SharedCard from '@/components/shares/SharedCard';
import { getUserShares, ShareItem } from '@/services/share.service';

export default function ProfileSharesPage() {
  const { id } = useParams<{ id: string }>();

  const [shares, setShares] = useState<ShareItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserShares(id)
      .then((res) => setShares(res.data))
      .catch(() => setShares([]))
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <section className="rounded-xl bg-black p-6 shadow-sm">
      <h2 className="text-2xl font-bold">Shares</h2>

      <p className="mt-1 text-sm text-gray-500">
        Reviews and posts shared by this user
      </p>

      {loading ? (
        <p className="mt-6 text-sm text-gray-500">Loading…</p>
      ) : shares.length === 0 ? (
        <div className="py-16 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
            ↗
          </div>
          <h3 className="mt-4 text-lg font-semibold">
            Nothing shared yet
          </h3>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {shares.map((share) => (
            <SharedCard
              key={share.id}
              share={share}
              onDeleted={(shareId) =>
                setShares((prev) =>
                  prev.filter((s) => s.id !== shareId),
                )
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}
