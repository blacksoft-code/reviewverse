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
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-4xl">

        <p className="text-sm text-gray-500">
          {entity.category.name}
        </p>

        <h1 className="mt-2 text-4xl font-bold">
          {entity.name}
        </h1>

        <p className="mt-4 text-lg">
          ⭐ {entity.averageRating}
        </p>

        {entity.description && (
          <p className="mt-4 text-gray-600">
            {entity.description}
          </p>
        )}

      <ReviewSection
      entityId={entity.id}
      initialReviews={entity.reviews}
      initialAverageRating={entity.averageRating}
      />

       

      </div>
    </main>
  );
}