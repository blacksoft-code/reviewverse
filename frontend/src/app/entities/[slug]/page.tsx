import Link from 'next/link';

import { getEntityBySlug } from '@/services/entity.service';
import ReviewSection from '@/components/reviews/ReviewSection';
import EntityActions from '@/components/entities/EntityActions';
import EntityFollowersLink from '@/components/entities/EntityFollowersLink';

type EntityPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EntityPage({
  params,
}: EntityPageProps) {
  const { slug } = await params;

  const response = await getEntityBySlug(slug);
  const entity = response.data;

  return (
    <main className="min-h-screen bg-gray-100">

      {/* ========================================= */}
      {/* COVER PHOTO */}
      {/* ========================================= */}

      <div className="h-64 w-full bg-gray-300">
        {entity.coverPhoto ? (
          <img
            src={entity.coverPhoto}
            alt={`${entity.name} cover`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-gray-500">
            No cover photo
          </div>
        )}
      </div>

      <div className="mx-auto max-w-6xl px-4 sm:px-6">

        {/* ========================================= */}
        {/* BUSINESS HEADER */}
        {/* ========================================= */}

        <section className="relative rounded-b-xl bg-black px-6 pb-6">

          {/* Logo */}

          <div className="-mt-16 flex items-end">
            <div className="flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border-4 border-white bg-gray-200 shadow">

              {entity.logo ? (
                <img
                  src={entity.logo}
                  alt={`${entity.name} logo`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-4xl font-bold text-gray-500">
                  {entity.name.charAt(0).toUpperCase()}
                </span>
              )}

            </div>
          </div>

          {/* Business Name */}

          <div className="mt-4">

            <p className="text-sm text-gray-500">
              {entity.category.name}
            </p>

            <div className="mt-1 flex items-center gap-2">

              <h1 className="text-3xl font-bold">
                {entity.name}
              </h1>

              {/* Verified mark */}

              {entity.isVerified && (
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500 text-sm text-white"
                  title="Verified business"
                >
                  ✓
                </span>
              )}

            </div>

            {/* Rating + Reviews */}

            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">

              <span className="font-semibold">
                ⭐ {entity.averageRating?.toFixed(1) ?? '0.0'}
              </span>

              <span className="text-gray-500">
                ({entity.reviews?.length ?? 0} reviews)
              </span>

              <span className="text-gray-400">
                •
              </span>

              {/* Opening status */}

              <span className="font-medium text-green-600">
                Open
              </span>

              {entity.businessHours && (
                <>
                  <span className="text-gray-600">
                    {entity.businessHours}
                  </span>

                  <button
                    type="button"
                    className="font-medium underline"
                  >
                    See hours
                  </button>
                </>
              )}

            </div>

          </div>

          {/* ========================================= */}
          {/* ACTION BUTTONS */}
          {/* ========================================= */}
          <div className="mt-6 flex flex-wrap gap-3">
            <EntityFollowersLink
            entityId={entity.id}
            slug={entity.slug}
            />
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            
            
            
            <EntityActions entityId={entity.id} />

            <button
              type="button"
              className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              Message
            </button>

            <button
              type="button"
              className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
            >
              More
            </button>

          </div>

        </section>

        {/* ========================================= */}
        {/* NAVIGATION TABS */}
        {/* ========================================= */}

        <nav className="mt-4 overflow-x-auto rounded-xl bg-black">
          <div className="flex min-w-max border-b">

            <a
              href={`/entities/${slug}/about`}
              className="border-b-2 border-black px-6 py-4 text-sm font-medium"
            >
              About
            </a>

            <a
              href={`/entities/${slug}/services`}
              className="px-6 py-4 text-sm font-medium text-gray-600 hover:text-black"
            >
              Services
            </a>

            <a
              href={`/entities/${slug}/photos`}
              className="px-6 py-4 text-sm font-medium text-gray-600 hover:text-black"
            >
              Photos
            </a>

            <a
              href={`/entities/${slug}/amenities`}
              className="px-6 py-4 text-sm font-medium text-gray-600 hover:text-black"
            >
              Amenities
            </a>

            <a
              href={`/entities/${slug}/qa`}
              className="px-6 py-4 text-sm font-medium text-gray-600 hover:text-black"
            >
              Q&A
            </a>

          </div>
        </nav>

        {/* ========================================= */}
        {/* QUICK ACTIONS */}
        {/* ========================================= */}

        <section className="mt-4 rounded-xl bg-black p-4">

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

            <Link
              href={`/entities/${slug}/add_a_review`}
              className="rounded-lg border px-4 py-3 text-center text-sm font-medium hover:bg-[#B91C1C]"
            >
              Add review
            </Link>

            <button
              type="button"
              className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-[#B91C1C]"
            >
              📷 Add photos
            </button>

            <button
              type="button"
              className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-[#B91C1C]"
            >
              🔖 Save
            </button>

            <button
              type="button"
              className="rounded-lg border px-4 py-3 text-sm font-medium hover:bg-[#B91C1C]"
            >
              ↗ Share
            </button>

          </div>

        </section>

        {/* ========================================= */}
        {/* MAIN CONTENT */}
        {/* ========================================= */}

        <div className="mt-4 grid gap-4 lg:grid-cols-3">

          {/* ======================================= */}
          {/* LEFT / MAIN */}
          {/* ======================================= */}

          <div className="space-y-4 lg:col-span-2">

            {/* ===================================== */}
            {/* ABOUT */}
            {/* ===================================== */}


            {/* ===================================== */}
            {/* REVIEWS */}
            {/* ===================================== */}

          <section className="bg-black p-6">

  <h2 className="text-xl font-bold text-white">
    Overall Rating
  </h2>

  <div className="mt-5 grid grid-cols-2 gap-6">

    {/* Left column */}
    <div>
      <p className="text-4xl font-bold text-white">
        {entity.averageRating?.toFixed(1) ??
          '0.0'}
      </p>

      <p className="mt-1">
        ⭐⭐⭐⭐⭐
      </p>

      <p className="mt-1 text-sm text-gray-400">
        {entity.reviews?.length ?? 0}{' '}
        reviews
      </p>
    </div>

    {/* Right column — Rating bars */}
    <div className="space-y-3 self-center">

      {[5, 4, 3, 2, 1].map(
        (rating) => (
          <div
            key={rating}
            className="flex items-center gap-3"
          >

            <span className="w-12 text-sm text-gray-300">
              {rating} star
            </span>

            <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-700">
              <div
                className="h-full rounded-full bg-[#B91C1C]"
                style={{
                  width:
                    rating === 5
                      ? `${Math.min(
                          entity.averageRating *
                            20,
                          100,
                        )}%`
                      : '0%',
                }}
              />
            </div>

          </div>
        ),
      )}

    </div>

  </div>

</section>

            <section className=" bg-black p-6">

              <div className="mt-6">
                <ReviewSection
                  entityId={entity.id}
                  initialReviews={entity.reviews}
                  initialAverageRating={
                    entity.averageRating
                  }
                />
              </div>

            </section>

          </div>

          {/* ======================================= */}
          {/* RIGHT SIDEBAR */}
          {/* ======================================= */}

          <aside className="space-y-4">

            {/* Rating summary */}

            


          </aside>

        </div>

      </div>

    </main>
  );
}