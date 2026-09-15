import { getEntityBySlug } from '@/services/entity.service';
import ReviewSection from '@/components/reviews/ReviewSection';

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
    <div className="mt-4 grid gap-4 lg:grid-cols-3">
      {/* LEFT / MAIN */}
      <div className="space-y-4 lg:col-span-2">

        {/* Overall Rating */}
        <section className="rounded-xl bg-black p-6">
          <h2 className="text-xl font-bold text-white">
            Overall Rating
          </h2>

          <div className="mt-5 grid grid-cols-2 gap-6">
            <div>
              <p className="text-4xl font-bold text-white">
                {entity.averageRating?.toFixed(1) ?? '0.0'}
              </p>

              <p className="mt-1">
                ⭐⭐⭐⭐⭐
              </p>

              <p className="mt-1 text-sm text-gray-400">
                {entity.reviews?.length ?? 0} reviews
              </p>
            </div>

            <div className="space-y-3 self-center">
              {[5, 4, 3, 2, 1].map((rating) => (
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
                                entity.averageRating * 20,
                                100,
                              )}%`
                            : '0%',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Reviews */}
        <section className="rounded-xl bg-black p-6">
          <ReviewSection
            entityId={entity.id}
            initialReviews={entity.reviews}
            initialAverageRating={entity.averageRating}
          />
        </section>
      </div>

      {/* RIGHT SIDEBAR */}
      <aside className="space-y-4">
        {/* Sidebar content */}
      </aside>
    </div>
  );
}