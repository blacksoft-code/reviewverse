'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import LocationPicker from '@/components/locations/LocationPicker';
import { getCategories, Category } from '@/services/category.service';
import {
  Entity,
  LocationSort,
  getEntitiesByLocation,
} from '@/services/entity.service';

const FIELD =
  'w-full rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] outline-none transition focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10';

const BTN_PRIMARY =
  'rounded-full bg-[#0071e3] px-6 py-2.5 text-[14px] font-medium text-white transition hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:bg-[#0071e3]/40';

const LABEL =
  'text-[13px] font-medium text-[#86868b]';

export default function ExplorePage() {
  const [locationId, setLocationId] = useState<
    string | null
  >(null);
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

  useEffect(() => {
    getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => {});
  }, []);

  async function handleSearch() {
    if (!locationId) {
      setError('আগে একটা location বাছাই করো।');
      return;
    }

    setError('');
    setLoading(true);
    setSearched(true);

    try {
      const response = await getEntitiesByLocation(
        locationId,
        {
          categoryId: categoryId || undefined,
          offeringType: offeringType.trim() || undefined,
          sort,
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

  return (
    <main
      className="min-h-screen bg-[#fbfbfd] pb-32"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* ───────── Header ───────── */}
      <div className="border-b border-[#d2d2d7]/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[720px] px-6 py-14">
          <p className="text-[13px] font-medium tracking-wide text-[#86868b]">
            Discover
          </p>
          <h1 className="mt-1 text-[40px] font-semibold leading-tight tracking-tight text-[#1d1d1f]">
            Explore by location
          </h1>
          <p className="mt-2 max-w-[480px] text-[17px] leading-relaxed text-[#86868b]">
            Choose an area — we&apos;ll search that
            area and everywhere within it.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[720px] px-6">
        {/* ───────── Search card ───────── */}
        <section className="mt-10 space-y-5 rounded-2xl border border-[#d2d2d7]/70 bg-white p-6">
          <div>
            <LocationPicker onChange={setLocationId} />
          </div>

          <div>
            <label className={LABEL}>
              Category
              <span className="ml-1.5 text-[#c4c4c9]">
                optional
              </span>
            </label>
            <select
              value={categoryId}
              onChange={(e) =>
                setCategoryId(e.target.value)
              }
              className={`mt-1.5 ${FIELD}`}
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
            <label className={LABEL}>
              Offering type
              <span className="ml-1.5 text-[#c4c4c9]">
                optional
              </span>
            </label>
            <input
              type="text"
              value={offeringType}
              onChange={(e) =>
                setOfferingType(e.target.value)
              }
              placeholder="e.g. Biriyani"
              className={`mt-1.5 ${FIELD}`}
            />
          </div>

          <div>
            <label className={LABEL}>Sort by</label>
            <select
              value={sort}
              onChange={(e) =>
                setSort(e.target.value as LocationSort)
              }
              className={`mt-1.5 ${FIELD}`}
            >
              <option value="rating_desc">
                Best rated
              </option>
              <option value="rating_asc">
                Worst rated
              </option>
              <option value="price_asc">
                Cheapest — works best with an offering
                type
              </option>
              <option value="price_desc">
                Most expensive
              </option>
            </select>
          </div>

          {error && (
            <p className="rounded-xl bg-[#ff3b30]/8 px-4 py-3 text-[14px] text-[#ff3b30]">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleSearch}
            disabled={loading}
            className={BTN_PRIMARY}
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </section>

        {/* ───────── Results ───────── */}
        {searched && !loading && (
          <section className="mt-10">
            <h2 className="px-1 text-[13px] font-medium uppercase tracking-wide text-[#86868b]">
              Results
              {results.length > 0 && (
                <> · {results.length}</>
              )}
            </h2>

            {results.length === 0 ? (
              <p className="mt-4 rounded-2xl border border-dashed border-[#d2d2d7] px-6 py-10 text-center text-[15px] text-[#86868b]">
                কোনো business পাওয়া যায়নি।
              </p>
            ) : (
              <div className="mt-4 divide-y divide-[#d2d2d7]/60 overflow-hidden rounded-2xl border border-[#d2d2d7]/70 bg-white">
                {results.map((entity) => (
                  <Link
                    key={entity.id}
                    href={`/entities/${entity.slug}`}
                    className="flex items-center justify-between px-5 py-4 transition hover:bg-[#f5f5f7]/60"
                  >
                    <div>
                      <p className="text-[16px] font-medium text-[#1d1d1f]">
                        {entity.name}
                      </p>
                      <p className="text-[13px] text-[#86868b]">
                        {entity.category?.name}
                      </p>
                    </div>

                    <span className="text-[15px] font-medium text-[#1d1d1f]">
                      ★ {entity.averageRating.toFixed(1)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}