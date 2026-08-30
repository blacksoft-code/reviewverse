import Link from 'next/link';

import { getEntityBySlug } from '@/services/entity.service';

type PhotosPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PhotosPage({
  params,
}: PhotosPageProps) {
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

        {/* Photos */}
        <section className="mt-6 rounded-xl border bg-black p-6">

          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">
                Photos
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Photos from {entity.name}
              </p>
            </div>

            <button
              type="button"
              className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
            >
              + Add Photos
            </button>
          </div>

          {/* Photo Grid */}
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

            {/* Cover Photo */}
            {entity.coverPhoto && (
              <div className="overflow-hidden rounded-lg border">
                <img
                  src={entity.coverPhoto}
                  alt={`${entity.name} cover`}
                  className="h-56 w-full object-cover"
                />
              </div>
            )}

            {/* Logo */}
            {entity.logo && (
              <div className="overflow-hidden rounded-lg border">
                <img
                  src={entity.logo}
                  alt={`${entity.name} logo`}
                  className="h-56 w-full object-contain bg-gray-50 p-4"
                />
              </div>
            )}

            {/* Empty State */}
            {!entity.coverPhoto && !entity.logo && (
              <div className="col-span-full rounded-lg border border-dashed p-12 text-center">
                <p className="text-gray-500">
                  No photos have been added yet.
                </p>

                <button
                  type="button"
                  className="mt-4 rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Add Photos
                </button>
              </div>
            )}

          </div>

        </section>

      </div>
    </main>
  );
}