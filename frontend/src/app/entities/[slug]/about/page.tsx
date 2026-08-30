import Link from 'next/link';

import { getEntityBySlug } from '@/services/entity.service';

type AboutPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AboutPage({
  params,
}: AboutPageProps) {
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

        {/* Header */}
        <section className="mt-6 overflow-hidden rounded-xl border bg-white">

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

        {/* About */}
        <section className="mt-6 rounded-xl border bg-white p-6">

          <h2 className="text-2xl font-semibold">
            About
          </h2>

          <div className="mt-5 space-y-5">

            {/* Description */}
            <div>
              <h3 className="font-semibold">
                About this business
              </h3>

              <p className="mt-2 leading-7 text-gray-600">
                {entity.description ||
                  'No business description has been added yet.'}
              </p>
            </div>

            {/* Location */}
            <div>
              <h3 className="font-semibold">
                Location
              </h3>

              <p className="mt-2 text-gray-600">
                {entity.location || 'Not provided'}
              </p>
            </div>

            {/* Phone */}
            <div>
              <h3 className="font-semibold">
                Phone
              </h3>

              {entity.phone ? (
                <a
                  href={`tel:${entity.phone}`}
                  className="mt-2 block text-blue-600 hover:underline"
                >
                  {entity.phone}
                </a>
              ) : (
                <p className="mt-2 text-gray-500">
                  Not provided
                </p>
              )}
            </div>

            {/* Website */}
            <div>
              <h3 className="font-semibold">
                Website
              </h3>

              {entity.website ? (
                <a
                  href={entity.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 block break-all text-blue-600 hover:underline"
                >
                  {entity.website}
                </a>
              ) : (
                <p className="mt-2 text-gray-500">
                  Not provided
                </p>
              )}
            </div>

            {/* Email */}
            <div>
              <h3 className="font-semibold">
                Email
              </h3>

              {entity.email ? (
                <a
                  href={`mailto:${entity.email}`}
                  className="mt-2 block text-blue-600 hover:underline"
                >
                  {entity.email}
                </a>
              ) : (
                <p className="mt-2 text-gray-500">
                  Not provided
                </p>
              )}
            </div>

          </div>
        </section>

        {/* Business Hours */}
        <section className="mt-6 rounded-xl border bg-white p-6">

          <h2 className="text-2xl font-semibold">
            Business Hours
          </h2>

          <p className="mt-4 whitespace-pre-line text-gray-600">
            {entity.businessHours ||
              'Business hours have not been added yet.'}
          </p>

        </section>

      </div>
    </main>
  );
}