import Link from 'next/link';
import { getCategoryBySlug } from '@/services/category.service';

type CategoryPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CategoryPage({
  params,
}: CategoryPageProps) {
  const { slug } = await params;

  // NEW:
  // URL-এর slug ব্যবহার করে backend থেকে category আনছি।
  const response = await getCategoryBySlug(slug);

  const category = response.data;

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-6xl">

        {/* Category name */}
        <h1 className="text-4xl font-bold">
          {category.name}
        </h1>

        <p className="mt-2 text-gray-500">
          Explore {category.name.toLowerCase()} reviews
        </p>

        {/* Entities section */}
        <section className="mt-10">

          <h2 className="text-2xl font-semibold">
            {category.name}
          </h2>

          {category.entities.length === 0 ? (
            // NEW:
            // এই category-তে কোনো entity না থাকলে
            // user-friendly empty state দেখাব।
            <p className="mt-6 text-gray-500">
              No entities found in this category.
            </p>
          ) : (
            <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">

              {category.entities.map((entity) => (
                <Link
                  key={entity.id}
                  href={`/entities/${encodeURIComponent(
                    entity.slug,
                  )}`}
                  className="rounded-lg border p-5 transition hover:shadow-md"
                >
                  <h3 className="text-xl font-semibold">
                    {entity.name}
                  </h3>

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

        </section>
      </div>
    </main>
  );
}