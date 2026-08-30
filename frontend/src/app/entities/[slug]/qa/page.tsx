import Link from 'next/link';

import { getEntityBySlug } from '@/services/entity.service';

type QAPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function QAPage({
  params,
}: QAPageProps) {
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

        {/* Q&A */}
        <section className="mt-6 rounded-xl border bg-black p-6">

          <h2 className="text-2xl font-semibold">
            Questions & Answers
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Ask questions about {entity.name} and help other
            people learn more about this business.
          </p>

          {/* Ask Question */}
          <div className="mt-6 rounded-lg border p-5">

            <h3 className="font-semibold">
              Have a question?
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Ask something about this business.
            </p>

            <button
              type="button"
              className="mt-4 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800"
            >
              Ask a Question
            </button>

          </div>

          {/* Empty State */}
          <div className="mt-6 rounded-lg border border-dashed p-10 text-center">

            <div className="text-3xl">
              ?
            </div>

            <h3 className="mt-3 font-semibold">
              No questions yet
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Be the first person to ask a question about this
              business.
            </p>

          </div>

        </section>

      </div>
    </main>
  );
}