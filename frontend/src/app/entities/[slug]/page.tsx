import { getEntityBySlug } from '@/services/entity.service';

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

        <section className="mt-10">
          <h2 className="text-2xl font-semibold">
            Reviews
          </h2>

          <div className="mt-6 space-y-4">

            {entity.reviews.length === 0 ? (
              <p className="text-gray-500">
                No reviews yet.
              </p>
            ) : (
              entity.reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-lg border p-5"
                >
                  <div className="flex justify-between">
                    <strong>
                      {review.user.name}
                    </strong>

                    <span>
                      ⭐ {review.rating}
                    </span>
                  </div>

                  <p className="mt-3">
                    {review.content}
                  </p>

                  <p className="mt-2 text-sm text-gray-500">
                    {new Date(
                      review.createdAt,
                    ).toLocaleDateString()}
                  </p>
                </article>
              ))
            )}

          </div>
        </section>

      </div>
    </main>
  );
}