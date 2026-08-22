import Link from 'next/link';
import { getTopRated } from '@/services/entity.service';

export default async function TopRatedPage() {
  const response = await getTopRated();

  const entities = response.data;

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl">

        {/* Page heading */}
        <h1 className="text-4xl font-bold">
          Top Rated
        </h1>

        <p className="mt-2 text-gray-600">
          Discover the highest-rated places and businesses
          on ReviewVerse.
        </p>

        {entities.length === 0 ? (
          // NEW:
          // কোনো entity না থাকলে empty state দেখাবে।
          <p className="mt-10 text-gray-500">
            No rated entities found yet.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

            {entities.map((entity, index) => (
              <Link
                key={entity.id}
                href={`/entities/${encodeURIComponent(
                  entity.slug,
                )}`}
                className="rounded-lg border p-5 transition hover:shadow-md"
              >
                {/* Ranking */}
                <p className="text-sm font-medium text-gray-500">
                  #{index + 1}
                </p>

                {/* Entity name */}
                <h2 className="mt-2 text-xl font-semibold">
                  {entity.name}
                </h2>

                {/* Rating */}
                <p className="mt-3 text-lg">
                  ⭐ {entity.averageRating.toFixed(1)}
                </p>

                {/* Category */}
                {entity.category && (
                  <p className="mt-2 text-sm text-gray-500">
                    {entity.category.name}
                  </p>
                )}

                {/* Description */}
                {entity.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-gray-600">
                    {entity.description}
                  </p>
                )}
              </Link>
            ))}

          </div>
        )}

      </div>
    </main>
  );
}