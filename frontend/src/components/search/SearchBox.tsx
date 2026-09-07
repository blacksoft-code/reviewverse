
'use client';

import {
  useEffect,
  useRef,
  useState,
} from 'react';

import { useRouter } from 'next/navigation';

import { search } from '@/services/search.service';

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

export default function SearchBox() {
  const router = useRouter();

  const [query, setQuery] = useState('');

  const [users, setUsers] =
    useState<SearchUser[]>([]);

  const [entities, setEntities] =
    useState<SearchEntity[]>([]);

  const [loading, setLoading] =
    useState(false);

  const [showResults, setShowResults] =
    useState(false);

  const searchRef =
    useRef<HTMLDivElement>(null);

  // =========================
  // AUTOCOMPLETE SEARCH
  // =========================

  useEffect(() => {
    const searchQuery = query.trim();

    if (!searchQuery) {
      setUsers([]);
      setEntities([]);
      setShowResults(false);
      return;
    }

    setShowResults(true);

    const timer = setTimeout(async () => {
      try {
        setLoading(true);

        const response =
          await search(searchQuery);

        const data =
          response.data as SearchResponse;

        setUsers(data.users ?? []);
        setEntities(data.entities ?? []);
      } catch (error) {
        console.error(
          'Search failed:',
          error,
        );

        setUsers([]);
        setEntities([]);
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
    function handleClickOutside(
      event: MouseEvent,
    ) {
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

  function handleUserClick(
    userId: string,
  ) {
    setShowResults(false);
    setQuery('');

    router.push(
      `/profile/${userId}`,
    );
  }

  // =========================
  // ENTITY CLICK
  // =========================

  function handleEntityClick(
    slug: string,
  ) {
    setShowResults(false);
    setQuery('');

    router.push(
      `/entities/${slug}`,
    );
  }

  const hasResults =
    users.length > 0 ||
    entities.length > 0;

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
          placeholder="Search people or businesses..."
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

      {/* AUTOCOMPLETE */}

      {showResults && query.trim() && (
        <div className="absolute left-0 right-20 top-full z-50 mt-2 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
          {loading && !hasResults ? (
            <div className="px-4 py-6 text-center text-sm text-gray-500">
              Searching...
            </div>
          ) : !hasResults ? (
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
                        handleUserClick(
                          user.id,
                        )
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
                        handleEntityClick(
                          entity.slug,
                        )
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
          )}
        </div>
      )}
    </div>
  );
}
