'use client';

import { Suspense, useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

import LocationPicker from '@/components/locations/LocationPicker';
import { getCategories, Category } from '@/services/category.service';
import { searchLocations } from '@/services/location.service';
import {
  parseExploreQuery,
} from '@/lib/parseExploreQuery';
import {
  Entity,
  LocationSort,
  getEntitiesByLocation,
} from '@/services/entity.service';

export default function ExplorePage() {
  return (
    <Suspense fallback={null}>
      <ExplorePageContent />
    </Suspense>
  );
}

function ExplorePageContent() {
  const searchParams = useSearchParams();

  const [locationId, setLocationId] = useState<
    string | null
  >(null);
  const [nlQuery, setNlQuery] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [offeringType, setOfferingType] = useState('');
  const [sort, setSort] =
    useState<LocationSort>('rating_desc');

  const [categories, setCategories] = useState<
    Category[]
  >([]);
  const [results, setResults] = useState<Entity[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState('');

  // Navbar-এর main search box থেকে ?q=... নিয়ে এলে সেটা দিয়ে
  // সরাসরি smart search চালানো হচ্ছে (categories লোড হওয়ার পরে,
  // নাহলে category matching ঠিকভাবে কাজ করবে না)
  useEffect(() => {
    getCategories()
      .then((res) => {
        setCategories(res.data);

        const q = searchParams.get('q');
        if (q) {
          setNlQuery(q);
          handleSmartSearch(q, res.data);
        }
      })
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function runSearch(params: {
    locId: string;
    catId?: string;
    offType?: string;
    sortBy: LocationSort;
  }) {
    setError('');
    setLoading(true);
    setSearched(true);

    try {
      const response = await getEntitiesByLocation(
        params.locId,
        {
          categoryId: params.catId || undefined,
          offeringType: params.offType || undefined,
          sort: params.sortBy,
        },
      );
      setResults(response.data);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Search failed',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch() {
    if (!locationId) {
      setError('আগে একটা location বাছাই করো।');
      return;
    }

    await runSearch({
      locId: locationId,
      catId: categoryId,
      offType: offeringType.trim(),
      sortBy: sort,
    });
  }

  // "Best biriyani in Mirpur 1"-এর মতো স্বাভাবিক বাক্য থেকে
  // sort + offering type + location বের করে সরাসরি search চালানো হয়
  // বাকি শব্দটা (যেমন "hospital", "biriyani") আগে category-র নামের
  // সাথে মিলিয়ে দেখা হয় — মিললে categoryId ব্যবহার হবে, নাহলে সেটা
  // offering type (যেমন "biriyani") হিসেবে ধরা হবে
  function matchCategory(
    term: string,
    categoryList: Category[],
  ) {
    const t = term.trim().toLowerCase();
    if (!t) return null;

    return (
      categoryList.find(
        (c) => c.name.toLowerCase() === t,
      ) ||
      categoryList.find(
        (c) =>
          c.name.toLowerCase() === `${t}s` ||
          `${c.name.toLowerCase()}s` === t,
      ) ||
      null
    );
  }

  async function handleSmartSearch(
    queryOverride?: string,
    categoriesOverride?: Category[],
  ) {
    const rawQuery = queryOverride ?? nlQuery;
    if (!rawQuery.trim()) return;

    const activeCategories =
      categoriesOverride ?? categories;

    setError('');

    const parsed = parseExploreQuery(rawQuery);

    if (!parsed.locationText) {
      setError(
        'একটা এলাকার নাম দাও, যেমন: "Best biriyani in Mirpur 1"',
      );
      return;
    }

    setLoading(true);
    setSearched(true);

    try {
      const locRes = await searchLocations(
        parsed.locationText,
      );
      const match = locRes.data[0];

      if (!match) {
        setError(
          `"${parsed.locationText}" নামে কোনো location খুঁজে পাওয়া যায়নি।`,
        );
        setLoading(false);
        return;
      }

      const categoryMatch = matchCategory(
        parsed.offeringType,
        activeCategories,
      );

      const resolvedCategoryId =
        categoryMatch?.id ?? '';
      const resolvedOfferingType = categoryMatch
        ? ''
        : parsed.offeringType;

      // নিচের manual controls-গুলোও sync করে দেওয়া হচ্ছে, যাতে দরকার হলে
      // user সেখান থেকে refine করতে পারে
      setLocationId(match.id);
      setCategoryId(resolvedCategoryId);
      setOfferingType(resolvedOfferingType);
      setSort(parsed.sort);

      await runSearch({
        locId: match.id,
        catId: resolvedCategoryId,
        offType: resolvedOfferingType,
        sortBy: parsed.sort,
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Search failed',
      );
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-bold">
          Explore by Location
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          একটা এলাকা বেছে নাও — সেই এলাকা আর তার সব
          sub-area-র ভেতরের business খুঁজে দেবে।
        </p>

        {/* Smart natural-language search box */}
        <div className="mt-6 rounded-xl border bg-white p-5">
          <label className="block text-sm font-medium">
            Search
          </label>
          <div className="mt-1 flex gap-2">
            <input
              type="text"
              value={nlQuery}
              onChange={(e) => setNlQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSmartSearch();
                }
              }}
              placeholder='e.g. "Best biriyani in Mirpur 1" or "Budget restaurants in Gulshan"'
              className="w-full rounded-lg border p-3 text-sm"
            />
            <button
              type="button"
              onClick={() => handleSmartSearch()}
              disabled={loading}
              className="whitespace-nowrap rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>
          <p className="mt-2 text-xs text-gray-400">
            "best/top/highest rated", "worst/lowest rated", "cheapest/budget/affordable",
            "most expensive/premium" — এই ধরনের শব্দ আর "in &lt;area&gt;" বুঝে নেবে।
          </p>
        </div>

        {/* Manual controls — smart search-এর ফলাফল refine করতে বা সরাসরি ব্যবহার করতে */}
        <div className="mt-4 space-y-4 rounded-xl border bg-white p-5">
          <LocationPicker
            initialLocationId={locationId}
            onChange={setLocationId}
          />

          <div>
            <label className="block text-sm font-medium">
              Category (optional)
            </label>
            <select
              value={categoryId}
              onChange={(e) =>
                setCategoryId(e.target.value)
              }
              className="mt-1 w-full rounded-lg border p-2.5 text-sm"
            >
              <option value="">All categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium">
              Offering type (optional)
            </label>
            <input
              type="text"
              value={offeringType}
              onChange={(e) =>
                setOfferingType(e.target.value)
              }
              placeholder="e.g. Biriyani"
              className="mt-1 w-full rounded-lg border p-2.5 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Sort by
            </label>
            <select
              value={sort}
              onChange={(e) =>
                setSort(e.target.value as LocationSort)
              }
              className="mt-1 w-full rounded-lg border p-2.5 text-sm"
            >
              <option value="rating_desc">
                Best rated
              </option>
              <option value="rating_asc">
                Worst rated
              </option>
              <option value="price_asc">
                Cheapest (offering type দিলে ভালো কাজ করে)
              </option>
              <option value="price_desc">
                Most expensive
              </option>
            </select>
          </div>

          {error && (
            <p className="text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>

        {/* Results */}

        {searched && !loading && (
          <div className="mt-6 space-y-3">
            {results.length === 0 ? (
              <p className="text-sm text-gray-500">
                কোনো business পাওয়া যায়নি।
              </p>
            ) : (
              results.map((entity) => (
                <Link
                  key={entity.id}
                  href={`/entities/${entity.slug}`}
                  className="block rounded-lg border bg-white p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">
                        {entity.name}
                      </h3>
                      <span className="text-xs text-gray-500">
                        {entity.category?.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium">
                      ⭐ {entity.averageRating.toFixed(1)}
                    </span>
                  </div>
                </Link>
              ))
            )}
          </div>
        )}
      </div>
    </main>
  );
}
