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
    <div className="mt-4 space-y-4">
      <section className="rounded-xl border bg-black p-6">
        <h2 className="text-2xl font-semibold">
          Services
        </h2>

        <p className="mt-2 text-gray-500">
          Services offered by {entity.name}
        </p>

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