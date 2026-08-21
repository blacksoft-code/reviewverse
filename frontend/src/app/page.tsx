import Link from 'next/link';

import { getCategories } from '@/services/category.service';
import { getEntities } from '@/services/entity.service';

import SearchBar from '@/components/search/SearchBar';

export default async function Home() {
  const [categoriesResponse, entitiesResponse] =
    await Promise.all([
      getCategories(),
      getEntities(1, 10),
    ]);

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">
        ReviewVerse
      </h1>

        <div className="mt-6">
          <SearchBar />
        </div>

      {/* Categories */}
      <section className="mt-8">
        <h2 className="text-2xl font-semibold">
          Categories
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {categoriesResponse.data.map(
            (category) => (
              <div
                key={category.id}
                className="rounded-lg border p-5"
              >
                <h3 className="text-xl font-semibold">
                  {category.name}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  /{category.slug}
                </p>
              </div>
            ),
          )}
        </div>
      </section>

      {/* Entities */}
      <section className="mt-12">
        <h2 className="text-2xl font-semibold">
          Entities
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

          {entitiesResponse.data.map(
            (entity) => (
              <Link
                key={entity.id}
                href={`/entities/${entity.slug}`}
                className="block rounded-lg border p-5 transition hover:shadow-md"
              >
                <h3 className="text-xl font-semibold">
                  {entity.name}
                </h3>

                <p className="mt-1 text-sm text-gray-500">
                  {entity.category.name}
                </p>

                <p className="mt-3">
                  ⭐ {entity.averageRating}
                </p>

                <p className="mt-2 text-sm text-gray-500">
                  /{entity.slug}
                </p>
              </Link>
            ),
          )}
        </div>
      </section>
    </main>
  );
}