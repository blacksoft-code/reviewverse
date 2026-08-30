import Link from 'next/link';

import { getEntityBySlug } from '@/services/entity.service';

type AmenitiesPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AmenitiesPage({
  params,
}: AmenitiesPageProps) {
  const { slug } = await params;

  const response = await getEntityBySlug(slug);
  const entity = response.data;

  const amenities = entity.amenities
    ? entity.amenities
        .split(',')
        .map((item: string) => item.trim())
        .filter(Boolean)
    : [];

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">

        {/* Back */}
        <Link
          href={`/entities/${slug}`}
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Back to business
        </Link>

        {/* Business Header */}
        <section className="mt-6 overflow-hidden rounded-xl border bg-black">

          {/* Cover Photo */}
          <div className="h-52 bg-gray-200">
            {entity.coverPhoto ? (
              <img
                src={entity.coverPhoto}
                alt={`${entity.name} cover`}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-gray-400">
                No cover photo
              </div>
            )}
          </div>

          {/* Business Info */}
          <div className="px-6 pb-6">

            {/* Logo */}
            <div className="-mt-14 h-28 w-28 overflow-hidden rounded-full border-4 border-white bg-gray-200">
              {entity.logo ? (
                <img
                  src={entity.logo}
                  alt={`${entity.name} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-3xl font-bold text-gray-400">
                  {entity.name.charAt(0)}
                </div>
              )}
            </div>

            <p className="mt-4 text-sm text-gray-500">
              {entity.category.name}
            </p>

            <h1 className="mt-1 text-3xl font-bold">
              {entity.name}
            </h1>

            <div className="mt-3 flex items-center gap-2">
              <span>
                ⭐ {entity.averageRating}
              </span>

              <span className="text-sm text-gray-500">
                ({entity.reviews.length} reviews)
              </span>
            </div>

          </div>
        </section>

        {/* Amenities */}
        <section className="mt-6 rounded-xl border bg-black p-6">

          <h2 className="text-2xl font-semibold">
            Amenities
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Facilities and amenities available at {entity.name}.
          </p>

          {amenities.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

              {amenities.map(
                (amenity: string, index: number) => (
                  <div
                    key={`${amenity}-${index}`}
                    className="flex items-center gap-3 rounded-lg border p-4"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
                      ✓
                    </span>

                    <span className="font-medium">
                      {amenity}
                    </span>
                  </div>
                ),
              )}

            </div>
          ) : (
            <div className="mt-6 rounded-lg border border-dashed p-10 text-center">
              <p className="text-gray-500">
                No amenities have been added yet.
              </p>
            </div>
          )}

        </section>

        {/* Payment Methods */}
        <section className="mt-6 rounded-xl border bg-black p-6">

          <h2 className="text-xl font-semibold">
            Payment Methods
          </h2>

          {entity.paymentMethods ? (
            <div className="mt-4 flex flex-wrap gap-3">

              {entity.paymentMethods
                .split(',')
                .map((method: string) => method.trim())
                .filter(Boolean)
                .map(
                  (method: string, index: number) => (
                    <span
                      key={`${method}-${index}`}
                      className="rounded-full border bg-gray-50 px-4 py-2 text-sm"
                    >
                      {method}
                    </span>
                  ),
                )}

            </div>
          ) : (
            <p className="mt-3 text-sm text-gray-500">
              Payment methods have not been provided.
            </p>
          )}

        </section>

      </div>
    </main>
  );
}