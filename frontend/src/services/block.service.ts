import { apiFetch } from '@/lib/api';

export type BlockOverview = {
  hiddenUserIds: string[];
  blockedEntityIds: string[];
};

const EMPTY: BlockOverview = {
  hiddenUserIds: [],
  blockedEntityIds: [],
};

// একই page-এ বারবার request না করার জন্য একটা ছোট cache —
// block/unblock হলে invalidateBlockOverview() দিয়ে ফেলে দেওয়া হয়
let cache: Promise<BlockOverview> | null = null;

export function invalidateBlockOverview() {
  cache = null;
}

export function loadBlockOverview(): Promise<BlockOverview> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;

  // login না থাকলে block বলে কিছু নেই
  if (!token) return Promise.resolve(EMPTY);

  if (!cache) {
    cache = apiFetch<{ data: BlockOverview }>('/blocks/me')
      .then((response) => response.data)
      .catch(() => {
        cache = null;
        return EMPTY;
      });
  }

  return cache;
}
