
import Link from 'next/link';

import { search } from '@/services/search.service';
import { parseExploreQuery } from '@/lib/parseExploreQuery';
import { searchLocations } from '@/services/location.service';
import { getCategories } from '@/services/category.service';
import {
  Entity,
  LocationSort,
  getEntitiesByLocation,
} from '@/services/entity.service';

const SORT_LABEL: Record<LocationSort, string> = {
  rating_desc: 'Best rated',
  rating_asc: 'Worst rated',
  price_asc: 'Cheapest',
  price_desc: 'Most expensive',
};

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
  }>;
};

export default async function SearchPage({
  searchParams,
}: SearchPageProps) {
  const params = await searchParams;

  const query = params.q?.trim() ?? '';

  if (!query) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-black">
            Search
          </h1>

          <p className="mt-3 text-gray-500">
            Enter something to search.
          </p>
        </div>
      </main>
    );
  }

    // "Best biriyani in Mirpur 1"-এর মতো location+ranking প্যাটার্ন
  // পেলে location-aware ranked search দেখানো হবে
  const parsed = parseExploreQuery(query);

  if (parsed.locationText) {
    const locRes = await searchLocations(
      parsed.locationText,
    );
    const matchedLocation = locRes.data[0];

    if (!matchedLocation) {
      return (
        <main className="min-h-screen bg-gray-50 p-8">
          <div className="mx-auto max-w-6xl">
            <h1 className="text-3xl font-bold text-black">
              Search Results
            </h1>
            <p className="mt-3 text-gray-500">
              "{parsed.locationText}" নামে কোনো location
              খুঁজে পাওয়া যায়নি।
            </p>
          </div>
        </main>
      );
    }

    const categoriesRes = await getCategories();
    const t = parsed.offeringType.trim().toLowerCase();

    const categoryMatch = t
      ? categoriesRes.data.find(
          (c) =>
            c.name.toLowerCase() === t ||
            c.name.toLowerCase() === `${t}s` ||
            `${c.name.toLowerCase()}s` === t,
        )
      : null;

    const resultsRes = await getEntitiesByLocation(
      matchedLocation.id,
      {
        categoryId: categoryMatch?.id,
        offeringType: categoryMatch
          ? undefined
          : parsed.offeringType || undefined,
        sort: parsed.sort,
      },
    );

    const locationResults = resultsRes.data;

    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold text-black">
            {SORT_LABEL[parsed.sort]}
            {parsed.offeringType
              ? ` ${parsed.offeringType}`
              : ''}{' '}
            in {matchedLocation.name}
          </h1>

          <p className="mt-2 text-gray-500">
            Results for{' '}
            <span className="font-medium text-black">
              "{query}"
            </span>
          </p>

          {locationResults.length === 0 ? (
            <div className="mt-10 rounded-xl border bg-white px-6 py-12 text-center">
              <div className="text-4xl">🔍</div>
              <h2 className="mt-4 text-lg font-semibold text-black">
                No results found
              </h2>
              <p className="mt-2 text-sm text-gray-500">
                {matchedLocation.name}-এ কোনো ম্যাচিং
                business পাওয়া যায়নি।
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {locationResults.map(
                (entity: Entity) => {
                  const matchingOffering =
                    entity.offerings?.[0];

                  return (
                    <Link
                      key={entity.id}
                      href={`/entities/${encodeURIComponent(entity.slug)}`}
                      className="rounded-xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                    >
                      <p className="text-sm font-medium text-gray-500">
                        {entity.category?.name}
                      </p>

                      <h3 className="mt-2 text-xl font-semibold text-black">
                        {entity.name}
                      </h3>

                      {entity.location && (
                        <p className="mt-2 text-sm text-gray-500">
                          📍 {entity.location}
                        </p>
                      )}

                      <div className="mt-3 flex items-center justify-between">
                        <p className="text-sm font-medium text-black">
                          ⭐{' '}
                          {entity.averageRating.toFixed(
                            1,
                          )}
                        </p>

                        {matchingOffering && (
                          <p className="text-sm font-medium text-black">
                            ৳{matchingOffering.price}
                          </p>
                        )}
                      </div>
                    </Link>
                  );
                },
              )}
            </div>
          )}
        </div>
      </main>
    );
  }
  
  const response = await search(query);

  const users = response.data.users ?? [];
  const entities =
    response.data.entities ?? [];

  const hasResults =
    users.length > 0 ||
    entities.length > 0;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div>
          <h1 className="text-3xl font-bold text-black">
            Search Results
          </h1>

          <p className="mt-2 text-gray-500">
            Results for{' '}
            <span className="font-medium text-black">
              "{query}"
            </span>
          </p>
        </div>

        {/* NO RESULTS */}

        {!hasResults && (
          <div className="mt-10 rounded-xl border bg-white px-6 py-12 text-center">
            <div className="text-4xl">
              🔍
            </div>

            <h2 className="mt-4 text-lg font-semibold text-black">
              No results found
            </h2>

            <p className="mt-2 text-sm text-gray-500">
              We couldn't find anything matching
              "{query}".
            </p>

            <p className="mt-1 text-sm text-gray-500">
              Try searching for another person or
              business.
            </p>
          </div>
        )}

        {/* PEOPLE */}

        {users.length > 0 && (
          <section className="mt-8">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-black">
                People
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                People matching your search
              </p>
            </div>

            <div className="overflow-hidden rounded-xl border bg-white">
              {users.map((user) => (
                <Link
                  key={user.id}
                  href={`/profile/${user.id}`}
                  className="flex items-center gap-4 border-b px-5 py-4 transition last:border-b-0 hover:bg-gray-50"
                >
                  {/* PFP */}

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-200 text-lg font-bold text-gray-700">
                    {user.name
                      .charAt(0)
                      .toUpperCase()}
                  </div>

                  {/* USER INFO */}

                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-black">
                      {user.name}
                    </h3>

                    <p className="mt-1 text-sm text-gray-500">
                      Profile
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* BUSINESSES */}

        {entities.length > 0 && (
          <section className="mt-10">
            <div className="mb-4">
              <h2 className="text-xl font-bold text-black">
                Businesses
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Businesses matching your search
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {entities.map((entity) => (
                <Link
                  key={entity.id}
                  href={`/entities/${encodeURIComponent(
                    entity.slug,
                  )}`}
                  className="rounded-xl border bg-white p-5 transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  {/* CATEGORY */}

                  <p className="text-sm font-medium text-gray-500">
                    {entity.category?.name}
                  </p>

                  {/* NAME */}

                  <h3 className="mt-2 text-xl font-semibold text-black">
                    {entity.name}
                  </h3>

                  {/* LOCATION */}

                  {entity.location && (
                    <p className="mt-2 text-sm text-gray-500">
                      📍 {entity.location}
                    </p>
                  )}

                  {/* RATING */}

                  <p className="mt-3 text-sm font-medium text-black">
                    ⭐{' '}
                    {entity.averageRating.toFixed(
                      1,
                    )}
                  </p>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>
    </main>
  );
}
