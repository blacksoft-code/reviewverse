'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getEntityFollowersCount } from '@/services/entity.service';

type EntityFollowersLinkProps = {
  entityId: string;
  slug: string;
};

export default function EntityFollowersLink({
  entityId,
  slug,
}: EntityFollowersLinkProps) {
  const router = useRouter();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    async function loadCount() {
      try {
        const result = await getEntityFollowersCount(entityId);
        setCount(result.data);
      } catch {
        setCount(0);
      }
    }

    loadCount();
  }, [entityId]);

  return (
    <button
      type="button"
      onClick={() => router.push(`/entities/${slug}/followers`)}
      className="text-sm text-gray-600 hover:text-black hover:underline"
    >
      {count ?? 0} followers
    </button>
  );
}