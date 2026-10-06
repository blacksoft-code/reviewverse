'use client';

import { useEffect, useRef, useState } from 'react';

import {
  Entity,
  searchEntities,
} from '@/services/entity.service';

type WorksAtPickerProps = {
  initialDisplayName?: string | null;
  onChange: (entityId: string | null) => void;
};

function displayName(entity: Entity) {
  return entity.location
    ? `${entity.name} - ${entity.location}`
    : entity.name;
}

// UserLocationPicker-এর মতোই — শুধু registered business (Entity)
// search করে, user নিজে নতুন business "তৈরি" করতে পারবে না এখান
// থেকে। কিছু না পেলে স্পষ্ট করে বলে দেয় সেটা registered না।
export default function WorksAtPicker({
  initialDisplayName,
  onChange,
}: WorksAtPickerProps) {
  const [query, setQuery] = useState(
    initialDisplayName ?? '',
  );
  const [suggestions, setSuggestions] = useState<Entity[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selectedId, setSelectedId] = useState<
    string | null
  >(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

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

  // শুধু debounced search — selection clear করার কাজ এখানে না
  // (UserLocationPicker-এ যে bug ধরা পড়েছিল সেটা এড়াতে, নিচে
  // handleInputChange দ্রষ্টব্য)
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
        const response = await searchEntities(
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

    // user নতুন করে টাইপ করছে মানে আগের selection আর valid না
    if (selectedId !== null) {
      setSelectedId(null);
      onChange(null);
    }
  }

  function selectEntity(entity: Entity) {
    setQuery(displayName(entity));
    setSelectedId(entity.id);
    setSuggestions([]);
    setOpen(false);
    onChange(entity.id);
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
        placeholder="যেমন: KFC - Dhaka"
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
              &quot;{query}&quot; is not registered yet.
            </p>
          )}

          {!loading &&
            suggestions.map((entity) => (
              <button
                key={entity.id}
                type="button"
                onClick={() => selectEntity(entity)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                {displayName(entity)}
              </button>
            ))}
        </div>
      )}
    </div>
  );
}