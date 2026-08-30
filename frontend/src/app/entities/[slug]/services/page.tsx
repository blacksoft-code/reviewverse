import Link from 'next/link';

import { getEntityBySlug } from '@/services/entity.service';

type ServicesPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ServicesPage({
  params,
}: ServicesPageProps) {
  const { slug } = await params;

  const response = await getEntityBySlug(slug);
  const entity = response.data;

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

          {/* Cover */}
          <div className="h-52 bg-black-200">
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

        {/* Services */}
        <section className="mt-6 rounded-xl border bg-black p-6">

          <h2 className="text-2xl font-semibold">
            Services
          </h2>

          <p className="mt-2 text-gray-500">
            Services offered by {entity.name}
          </p>

          {/* Service Options */}
          <div className="mt-6">

            {entity.serviceOptions ? (
              <div className="rounded-lg border bg-gray-50 p-5">
                <h3 className="font-semibold">
                  Available Services
                </h3>

                <p className="mt-3 whitespace-pre-line leading-7 text-gray-600">
                  {entity.serviceOptions}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-8 text-center">
                <p className="text-gray-500">
                  No services have been added yet.
                </p>
              </div>
            )}

          </div>

        </section>

        {/* Price Range */}
        <section className="mt-6 rounded-xl border bg-black p-6">

          <h2 className="text-xl font-semibold">
            Price Range
          </h2>

          <p className="mt-3 text-gray-600">
            {entity.priceRange || 'Not provided'}
          </p>

        </section>

      </div>
    </main>
  );
}