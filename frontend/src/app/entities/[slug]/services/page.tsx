import { getEntityBySlug } from '@/services/entity.service';
import { getOfferingsByEntity } from '@/services/offering.service';

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

  const offeringsResponse = await getOfferingsByEntity(
    entity.id,
  );
  const offerings = offeringsResponse.data;

  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-xl border bg-black p-6">
        <h2 className="text-2xl font-semibold">
          Offerings
        </h2>

        <p className="mt-2 text-gray-500">
          What {entity.name} offers
        </p>

        <div className="mt-6 space-y-3">
          {offerings.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <p className="text-gray-500">
                No offerings have been added yet.
              </p>
            </div>
          ) : (
            offerings.map((offering) => (
              <div
                key={offering.id}
                className="rounded-lg border bg-gray-50 p-5"
              >
                <div className="flex items-start gap-4">
                  {offering.media[0]?.url && (
                    <img
                      src={offering.media[0].url}
                      alt={offering.name}
                      className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                    />
                  )}

                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <h3 className="font-semibold">
                          {offering.name}
                        </h3>
                        <span className="text-xs text-gray-500">
                          {offering.type}
                        </span>
                      </div>

                      <span className="whitespace-nowrap font-semibold">
                        ৳{offering.price}
                      </span>
                    </div>

                    {offering.description && (
                      <p className="mt-3 whitespace-pre-line leading-7 text-gray-600">
                        {offering.description}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      <section className="mt-6 rounded-xl border bg-black p-6">
        <h2 className="text-xl font-semibold">
          Price Range
        </h2>

        <p className="mt-3 text-gray-600">
          {entity.priceRange || 'Not provided'}
        </p>
      </section>
    </div>
  );
}
