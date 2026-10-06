'use client';

import { useEffect, useRef, useState } from 'react';

import {
  Location,
  searchLocations,
} from '@/services/location.service';

type UserLocationPickerProps = {
  initialDisplayName?: string | null;
  onChange: (locationId: string | null) => void;
};

// LocationPicker (business-এর জন্য) breadcrumb chip style দেখায়
// (Bangladesh › Dhaka › Mirpur), ধাপে ধাপে বানাতে হয়। এটা তার থেকে
// আলাদা — একটা সাধারণ search box, suggestion-এ সরাসরি "Mirpur,
// Dhaka, Bangladesh" (leaf → root) দেখায়, এক ক্লিকেই select হয়ে যায়।
// নতুন location তৈরি করার অপশন এখানে ইচ্ছাকৃতভাবে নেই (profile থেকে
// location tree-তে নতুন node যোগ করা উচিত না)।
export default function UserLocationPicker({
  initialDisplayName,
  onChange,
}: UserLocationPickerProps) {
  const [query, setQuery] = useState(
    initialDisplayName ?? '',
  );
  const [suggestions, setSuggestions] = useState<
    Location[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<
    string | null
  >(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  // initialDisplayName পরে (async load হওয়ার পর) এলে input-এ বসানো
  useEffect(() => {
    if (initialDisplayName) {
      setQuery(initialDisplayName);
    }
  }, [initialDisplayName]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    );
    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      );
  }, []);

  // ⚠️ আগে এখানে একটা useEffect([query]) ছিল যেটা "selectedId !== null
  // হলে clear করে দাও" লজিক রাখতো — কিন্তু selectLocation()-এর
  // setQuery() কলও তো query বদলায়, তাই select করার সাথে সাথেই এই
  // effect চলে নিজের করা selection নিজেই মুছে ফেলতো (onChange(null)
  // কল করে)। তাই UI-তে নাম দেখাতো, কিন্তু আসল id কখনো save হতো না।
  //
  // Fix: selection clear করার কাজ এখন শুধু handleInputChange()-এ হয়
  // (সরাসরি user টাইপ করলেই), প্রোগ্রাম্যাটিক setQuery-এর সাথে আর
  // conflict করে না। এই effect-টা শুধু debounced search করে, selection
  // touch করে না।
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
  }, [query]);

  function handleInputChange(value: string) {
    setQuery(value);
    setOpen(true);

    // user নতুন করে টাইপ করছে মানে আগের selection আর valid না,
    // যতক্ষণ না আবার suggestion থেকে কিছু select করে
    if (selectedId !== null) {
      setSelectedId(null);
      onChange(null);
    }
  }

  function selectLocation(location: Location) {
    setQuery(location.displayName ?? location.name);
    setSelectedId(location.id);
    setSuggestions([]);
    setOpen(false);
    onChange(location.id);
  }

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) =>
          handleInputChange(e.target.value)
        }
        onFocus={() => setOpen(true)}
        placeholder="যেমন: Mirpur, Dhaka, Bangladesh"
        className="mt-1 w-full rounded-lg border p-2.5 text-sm"
      />

      {open && query.trim().length > 0 && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white shadow-lg">
          {loading && (
            <p className="px-3 py-2 text-sm text-gray-400">
              Searching...
            </p>
          )}

          {!loading && suggestions.length === 0 && (
            <p className="px-3 py-2 text-sm text-gray-400">
              No matching location found.
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
                {loc.displayName ?? loc.name}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}