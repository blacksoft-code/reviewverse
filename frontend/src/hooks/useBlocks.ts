'use client';

import { useEffect, useState } from 'react';

import { loadBlockOverview } from '@/services/block.service';

const EMPTY_SET: ReadonlySet<string> = new Set();

// কোন user/entity আমার কাছ থেকে লুকানো থাকবে (দুই দিকের user block +
// আমার block করা entity) — Facebook-এর মতো।
export function useBlocks() {
  const [state, setState] = useState<{
    loading: boolean;
    hiddenUserIds: ReadonlySet<string>;
    blockedEntityIds: ReadonlySet<string>;
  }>({
    loading: true,
    hiddenUserIds: EMPTY_SET,
    blockedEntityIds: EMPTY_SET,
  });

  useEffect(() => {
    let active = true;

    loadBlockOverview().then((overview) => {
      if (!active) return;

      setState({
        loading: false,
        hiddenUserIds: new Set(overview.hiddenUserIds),
        blockedEntityIds: new Set(overview.blockedEntityIds),
      });
    });

    return () => {
      active = false;
    };
  }, []);

  return state;
}
