
'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import { search } from '@/services/search.service';
import {
  SORT_KEYWORDS,
  escapeRegex,
} from '@/lib/parseExploreQuery';
import { searchLocations, Location } from '@/services/location.service';
import { getCategories } from '@/services/category.service';
import { searchOfferingTypes } from '@/services/offering.service';

type SearchUser = {
  id: string;
  name: string;
  createdAt: string;
};

type SearchEntity = {
  id: string;
  name: string;
  slug: string;
  location: string | null;
  averageRating: number;

  category: {
    id: string;
    name: string;
    slug: string;
  };
};

type SearchResponse = {
  users: SearchUser[];
  entities: SearchEntity[];
};

type CategorySuggestion = {
  label: string;
  kind: 'category' | 'offering';
};

// query-র শেষ অংশ বিশ্লেষণ করে বলে দেয় এখন কোন ধাপে আছি:
// - "in <partial>" দিয়ে শেষ হলে → location suggest করতে হবে
// - কোনো sort শব্দ (best/worst/cheapest/...) দিয়ে শুরু হয়ে এখনো "in" না
//   এলে → category/offering suggest করতে হবে
// - কোনোটাই না → সাধারণ নাম-সার্চ (আগের behavior)
type Phase =
  | {
      type: 'location';
      prefixLength: number;
      partial: string;
    }
  | {
      type: 'category';
      prefixLength: number;
      partial: string;
    }
  | { type: 'none' };

const ALL_SORT_PHRASES = Object.values(SORT_KEYWORDS)
  .flat()
  .sort((a, b) => b.length - a.length);

function computePhase(rawQuery: string): Phase {
  const inMatch = rawQuery.match(
    /\bin\s+([a-z0-9 .'-]*)$/i,
  );

  if (inMatch && inMatch.index !== undefined) {
    const partial = inMatch[1] ?? '';
    const prefixLength =
      inMatch.index + inMatch[0].length - partial.length;

    return { type: 'location', prefixLength, partial };
  }

  for (const phrase of ALL_SORT_PHRASES) {
    const re = new RegExp(
      `^\\s*${escapeRegex(phrase)}\\b`,
      'i',
    );
    const m = rawQuery.match(re);

    if (m) {
      const prefixLength = m[0].length;
      const partial = rawQuery.slice(prefixLength).trim();
      return { type: 'category', prefixLength, partial };
    }
  }

  return { type: 'none' };
}

export default function SearchBox() {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState<Phase>({
    type: 'none',
  });

  // সাধারণ নাম-সার্চ (phase: none)
  const [users, setUsers] = useState<SearchUser[]>([]);
  const [entities, setEntities] = useState<
    SearchEntity[]
  >([]);

  // category/offering suggestion (phase: category)
  const [categorySuggestions, setCategorySuggestions] =
    useState<CategorySuggestion[]>([]);

  // location suggestion (phase: location)
  const [locationSuggestions, setLocationSuggestions] =
    useState<Location[]>([]);

  const [loading, setLoading] = useState(false);
  const [showResults, setShowResults] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  // =========================
  // PHASE-AWARE AUTOCOMPLETE
  // =========================

  useEffect(() => {
    const trimmed = query.trim();

    if (!trimmed) {
      setUsers([]);
      setEntities([]);
      setCategorySuggestions([]);
      setLocationSuggestions([]);
      setShowResults(false);
      setPhase({ type: 'none' });
      return;
    }

    const currentPhase = computePhase(query);
    setPhase(currentPhase);
    setShowResults(true);

    const timer = setTimeout(async () => {
      setLoading(true);

      try {
        if (currentPhase.type === 'location') {
          setUsers([]);
          setEntities([]);
          setCategorySuggestions([]);

          if (!currentPhase.partial.trim()) {
            setLocationSuggestions([]);
            return;
          }

          const res = await searchLocations(
            currentPhase.partial.trim(),
          );
          setLocationSuggestions(res.data);
          return;
        }

        if (currentPhase.type === 'category') {
          setUsers([]);
          setEntities([]);
          setLocationSuggestions([]);

          if (!currentPhase.partial.trim()) {
            setCategorySuggestions([]);
            return;
          }

          const term =
            currentPhase.partial.trim().toLowerCase();

          const [catRes, typeRes] = await Promise.all([
            getCategories(),
            searchOfferingTypes(term),
          ]);

          const matchedCategories: CategorySuggestion[] =
            catRes.data
              .filter((c) =>
                c.name.toLowerCase().includes(term),
              )
              .map((c) => ({
                label: c.name,
                kind: 'category' as const,
              }));

          const matchedOfferings: CategorySuggestion[] =
            typeRes.data.map((t) => ({
              label: t,
              kind: 'offering' as const,
            }));

          setCategorySuggestions([
            ...matchedCategories,
            ...matchedOfferings,
          ]);
          return;
        }

        // phase: none — আগের মতো সাধারণ নাম-সার্চ
        setCategorySuggestions([]);
        setLocationSuggestions([]);

        const response = await search(trimmed);
        const data = response.data as SearchResponse;

        setUsers(data.users ?? []);
        setEntities(data.entities ?? []);
      } catch (error) {
        console.error('Search failed:', error);
        setUsers([]);
        setEntities([]);
        setCategorySuggestions([]);
        setLocationSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [query]);

  // =========================
  // CLOSE DROPDOWN
  // =========================

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        searchRef.current &&
        !searchRef.current.contains(
          event.target as Node,
        )
      ) {
        setShowResults(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    );

    return () => {
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      );
    };
  }, []);

  // =========================
  // SUGGESTION SELECT
  // =========================

  function applyCategorySuggestion(label: string) {
    if (phase.type !== 'category') return;

    const prefix = query.slice(0, phase.prefixLength);
    setQuery(`${prefix.trim()} ${label} `);
    setCategorySuggestions([]);
  }

  function applyLocationSuggestion(name: string) {
    if (phase.type !== 'location') return;

    const prefix = query.slice(0, phase.prefixLength);
    setQuery(`${prefix}${name}`);
    setLocationSuggestions([]);
    setShowResults(false);
  }

  // =========================
  // SEARCH BUTTON
  // =========================

  function handleSearch() {
    const searchQuery = query.trim();

    if (!searchQuery) {
      return;
    }

    setShowResults(false);

    router.push(
      `/search?q=${encodeURIComponent(
        searchQuery,
      )}`,
    );
  }

  // =========================
  // ENTER KEY
  // =========================

  function handleKeyDown(
    event: React.KeyboardEvent<HTMLInputElement>,
  ) {
    if (event.key === 'Enter') {
      handleSearch();
    }

    if (event.key === 'Escape') {
      setShowResults(false);
    }
  }

  // =========================
  // USER CLICK
  // =========================

  function handleUserClick(userId: string) {
    setShowResults(false);
    setQuery('');

    router.push(`/profile/${userId}`);
  }

  // =========================
  // ENTITY CLICK
  // =========================

  function handleEntityClick(slug: string) {
    setShowResults(false);
    setQuery('');

    router.push(`/entities/${slug}`);
  }

  const hasNameResults =
    users.length > 0 || entities.length > 0;

  return (
    <div
      ref={searchRef}
      className="relative flex w-full max-w-xl gap-2"
    >
      {/* SEARCH INPUT */}

      <div className="relative flex-1">
        <input
          type="text"
          value={query}
          onChange={(event) =>
            setQuery(event.target.value)
          }
          onFocus={() => {
            if (query.trim()) {
              setShowResults(true);
            }
          }}
          onKeyDown={handleKeyDown}
          placeholder='Search people, businesses, or try "best biriyani in Mirpur"'
          className="w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 pr-10 text-sm text-black outline-none transition focus:border-black focus:ring-1 focus:ring-black"
        />

        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-black" />
          </div>
        )}
      </div>

      {/* SEARCH BUTTON */}

      <button
        type="button"
        onClick={handleSearch}
        disabled={!query.trim()}
        className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Search
      </button>

      {/* DROPDOWN */}

      {showResults && query.trim() && (
        <div className="absolute left-0 right-20 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">

          {/* PHASE: CATEGORY / OFFERING SUGGESTIONS */}

          {phase.type === 'category' && (
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  Searching...
                </div>
              ) : categorySuggestions.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  Keep typing a category or offering
                  (e.g. Biriyani, Burger)...
                </div>
              ) : (
                categorySuggestions.map((s) => (
                  <button
                    key={`${s.kind}-${s.label}`}
                    type="button"
                    onClick={() =>
                      applyCategorySuggestion(s.label)
                    }
                    className="flex w-full items-center justify-between border-b px-4 py-3 text-left text-sm hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-900">
                      {s.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      {s.kind === 'category'
                        ? 'Category'
                        : 'Offering'}
                    </span>
                  </button>
                ))
              )}
            </div>
          )}

          {/* PHASE: LOCATION SUGGESTIONS */}

          {phase.type === 'location' && (
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  Searching...
                </div>
              ) : locationSuggestions.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-gray-500">
                  Keep typing an area name (e.g. Dhaka,
                  Mirpur)...
                </div>
              ) : (
                locationSuggestions.map((loc) => (
                  <button
                    key={loc.id}
                    type="button"
                    onClick={() =>
                      applyLocationSuggestion(loc.name)
                    }
                    className="block w-full border-b px-4 py-3 text-left text-sm hover:bg-gray-50"
                  >
                    <span className="font-medium text-gray-900">
                      {loc.name}
                    </span>
                    {loc.parent && (
                      <span className="ml-1 text-xs text-gray-400">
                        — {loc.parent.name}
                      </span>
                    )}
                  </button>
                ))
              )}
            </div>
          )}

          {/* PHASE: NONE — নাম দিয়ে সাধারণ সার্চ (আগের মতো) */}

          {phase.type === 'none' &&
            (loading && !hasNameResults ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500">
                Searching...
              </div>
            ) : !hasNameResults ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm font-medium text-gray-900">
                  No results found
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Try another name or business.
                </p>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">

                {/* PEOPLE */}

                {users.length > 0 && (
                  <div>
                    <div className="border-b bg-gray-50 px-4 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        People
                      </p>
                    </div>

                    {users.map((user) => (
                      <button
                        key={user.id}
                        type="button"
                        onClick={() =>
                          handleUserClick(user.id)
                        }
                        className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition hover:bg-gray-50"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-200 text-sm font-bold text-gray-700">
                          {user.name
                            .charAt(0)
                            .toUpperCase()}
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {user.name}
                          </p>

                          <p className="text-xs text-gray-500">
                            Profile
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* BUSINESSES */}

                {entities.length > 0 && (
                  <div>
                    <div className="border-b bg-gray-50 px-4 py-2">
                      <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Businesses
                      </p>
                    </div>

                    {entities.map((entity) => (
                      <button
                        key={entity.id}
                        type="button"
                        onClick={() =>
                          handleEntityClick(entity.slug)
                        }
                        className="flex w-full items-center gap-3 border-b px-4 py-3 text-left transition hover:bg-gray-50"
                      >
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-lg">
                          🏢
                        </div>

                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">
                            {entity.name}
                          </p>

                          <p className="truncate text-xs text-gray-500">
                            {entity.category.name}

                            {entity.location
                              ? ` · ${entity.location}`
                              : ''}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {/* SEE ALL RESULTS */}

                <button
                  type="button"
                  onClick={handleSearch}
                  className="w-full border-t px-4 py-3 text-center text-sm font-medium text-black transition hover:bg-gray-50"
                >
                  See all results
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
