'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getEntityFollowersCount } from '@/services/entity.service';

type EntityFollowersLinkProps = {
  entityId: string;
  slug: string;
  className?: string;
};

export default function EntityFollowersLink({
  entityId,
  slug,
  className = 'text-sm text-gray-600 hover:text-black hover:underline',
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
      className={className}
    >
      {count ?? 0} followers
    </button>
  );
}