
import { getEntityBySlug } from '@/services/entity.service';

type AmenitiesPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AmenitiesPage({
  params,
}: AmenitiesPageProps) {
  const { slug } = await params;

  const response = await getEntityBySlug(slug);
  const entity = response.data;

  const amenities = entity.amenities
    ? entity.amenities
        .split(',')
        .map((item: string) => item.trim())
        .filter(Boolean)
    : [];

  const paymentMethods = entity.paymentMethods
    ? entity.paymentMethods
        .split(',')
        .map((method: string) => method.trim())
        .filter(Boolean)
    : [];

  return (
    <div className="mt-4 space-y-4">
      {/* Amenities */}
      <section className="rounded-xl bg-black p-6">
        <h2 className="text-2xl font-semibold text-white">
          Amenities
        </h2>

        <p className="mt-1 text-sm text-gray-400">
          Facilities and amenities available at {entity.name}.
        </p>

        {amenities.length > 0 ? (
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {amenities.map(
              (amenity: string, index: number) => (
                <div
                  key={`${amenity}-${index}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-700 p-4"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gray-100 text-black">
                    ✓
                  </span>

                  <span className="font-medium text-white">
                    {amenity}
                  </span>
                </div>
              ),
            )}
          </div>
        ) : (
          <div className="mt-6 rounded-lg border border-dashed border-gray-700 p-10 text-center">
            <p className="text-gray-400">
              No amenities have been added yet.
            </p>
          </div>
        )}
      </section>

      {/* Payment Methods */}
      <section className="rounded-xl bg-black p-6">
        <h2 className="text-xl font-semibold text-white">
          Payment Methods
        </h2>

        {paymentMethods.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-3">
            {paymentMethods.map(
              (method: string, index: number) => (
                <span
                  key={`${method}-${index}`}
                  className="rounded-full border border-gray-700 bg-gray-50 px-4 py-2 text-sm text-black"
                >
                  {method}
                </span>
              ),
            )}
          </div>
        ) : (
          <p className="mt-3 text-sm text-gray-400">
            Payment methods have not been provided.
          </p>
        )}
      </section>
    </div>
  );
}
