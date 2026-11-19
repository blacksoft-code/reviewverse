import { getEntityBySlug } from '@/services/entity.service';
import ReviewSection from '@/components/reviews/ReviewSection';
import ReviewOverview from '@/components/reviews/ReviewOverview';

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

        {/* Customer Reviews overview + Write a Review */}
        <ReviewOverview
          reviews={entity.reviews ?? []}
          averageRating={entity.averageRating}
          writeReviewHref={`/entities/${slug}/add_a_review`}
        />

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