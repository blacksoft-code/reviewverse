import Link from 'next/link';
import { searchEntities } from '@/services/entity.service';

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
      <main className="min-h-screen p-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold">
            Search
          </h1>

          <p className="mt-3 text-gray-500">
            Enter something to search.
          </p>
        </div>
      </main>
    );
  }

  const response = await searchEntities(query);

  const entities = response.data;

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl">

        <h1 className="text-3xl font-bold">
          Search Results
        </h1>

        <p className="mt-2 text-gray-500">
          Results for "{query}"
        </p>

        {entities.length === 0 ? (
          <p className="mt-8 text-gray-500">
            No entities found.
          </p>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {entities.map((entity) => (
              <Link
                key={entity.id}
                href={`/entities/${encodeURIComponent(
                  entity.slug,
                )}`}
                className="rounded-lg border p-5 transition hover:shadow-md"
              >
                <p className="text-sm text-gray-500">
                  {entity.category?.name}
                </p>

                <h2 className="mt-2 text-xl font-semibold">
                  {entity.name}
                </h2>

                <p className="mt-3">
                  ⭐ {entity.averageRating.toFixed(1)}
                </p>

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