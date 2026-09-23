'use client';

import { useEffect, useRef, useState } from 'react';

import {
  Location,
  createLocation,
  getLocationPath,
  searchLocations,
} from '@/services/location.service';

type LocationPickerProps = {
  onChange: (locationId: string | null) => void;
  initialLocationId?: string | null;
  // পুরো breadcrumb (root → leaf) লাগলে এটা ব্যবহার করো —
  // যেমন পুরনো free-text location field auto-fill করতে
  onPathChange?: (path: Location[]) => void;
};

// একটা breadcrumb-স্টাইল location picker:
// - প্রতিটা ধাপে user টাইপ করলে ঐ parent-এর নিচের existing location suggest হয়
// - existing না পেলে "নতুন তৈরি করো" অপশন দেখায়
// - selection করার পর সেটা breadcrumb chip হয়ে যায়, আর নিচের tier-এ যাওয়া যায়
export default function LocationPicker({
  onChange,
  initialLocationId,
  onPathChange,
}: LocationPickerProps) {
  const [path, setPath] = useState<Location[]>([]); // নির্বাচিত chain (root → leaf)
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<
    Location[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const debounceRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  // এডিট করার সময় business-এর আগে থেকে সেট করা location দেখানোর জন্য
  useEffect(() => {
    if (!initialLocationId) return;

    getLocationPath(initialLocationId)
      .then((response) => setPath(response.data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialLocationId]);

  const currentParent = path[path.length - 1] ?? null;

  useEffect(() => {
    onPathChange?.(path);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path]);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchLocations(
          query.trim(),
          currentParent?.id,
        );
        setSuggestions(response.data);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, currentParent?.id]);

  function selectLocation(location: Location) {
    const newPath = [...path, location];
    setPath(newPath);
    setQuery('');
    setSuggestions([]);
    onChange(location.id);
  }

  async function handleCreateNew() {
    if (!query.trim()) return;

    setCreating(true);
    try {
      const response = await createLocation({
        name: query.trim(),
        parentId: currentParent?.id,
      });
      selectLocation(response.data);
    } catch {
      // no-op — নেটওয়ার্ক/ভ্যালিডেশন এরর হলে suggestion না দেখিয়ে চুপ থাকা
    } finally {
      setCreating(false);
    }
  }

  function removeFromPath(index: number) {
    const newPath = path.slice(0, index);
    setPath(newPath);
    setQuery('');
    setSuggestions([]);
    onChange(newPath[newPath.length - 1]?.id ?? null);
  }

  const exactMatch = suggestions.some(
    (s) =>
      s.name.toLowerCase() ===
      query.trim().toLowerCase(),
  );

  return (
    <div>
      <label className="block text-sm font-medium">
        Location (Area)
      </label>

      {/* Breadcrumb chips */}
      {path.length > 0 && (
        <div className="mt-2 flex flex-wrap items-center gap-2">
          {path.map((loc, index) => (
            <div key={loc.id} className="flex items-center gap-1">
              <span className="rounded-full bg-gray-100 px-3 py-1 text-sm">
                {loc.name}
              </span>
              {index === path.length - 1 && (
                <button
                  type="button"
                  onClick={() => removeFromPath(index)}
                  className="text-xs text-gray-400 hover:text-red-500"
                  title="Remove"
                >
                  ✕
                </button>
              )}
              {index < path.length - 1 && (
                <span className="text-gray-300">›</span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Search/add box */}
      <div className="relative mt-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            currentParent
              ? `${currentParent.name}-এর ভেতরে area/লোকেশন খুঁজুন বা যোগ করুন`
              : 'Country/City দিয়ে শুরু করুন (যেমন: Bangladesh)'
          }
          className="w-full rounded-lg border p-3 text-sm"
        />

        {(query.trim().length > 0) && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
            {loading && (
              <p className="px-3 py-2 text-sm text-gray-400">
                Searching...
              </p>
            )}

            {!loading &&
              suggestions.map((loc) => (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => selectLocation(loc)}
                  className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
                >
                  {loc.name}
                  {loc.parent && (
                    <span className="ml-1 text-xs text-gray-400">
                      — {loc.parent.name}
                    </span>
                  )}
                </button>
              ))}

            {!loading && !exactMatch && (
              <button
                type="button"
                onClick={handleCreateNew}
                disabled={creating}
                className="block w-full border-t px-3 py-2 text-left text-sm text-blue-600 hover:bg-blue-50 disabled:opacity-50"
              >
                {creating
                  ? 'Adding...'
                  : `+ "${query.trim()}" নতুন location হিসেবে যোগ করো`}
              </button>
            )}
          </div>
        )}
      </div>

      <p className="mt-1 text-xs text-gray-400">
        বড় area থেকে ছোট area-র দিকে ধাপে ধাপে যোগ করো (যেমন: Bangladesh →
        Dhaka → Mirpur → Mirpur 1)। যত specific location দেবে, search-এ business
        তত সহজে খুঁজে পাওয়া যাবে।
      </p>
    </div>
  );
}
