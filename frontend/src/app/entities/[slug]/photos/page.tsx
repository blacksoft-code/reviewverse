import { getEntityBySlug } from '@/services/entity.service';

type PhotosPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PhotosPage({
  params,
}: PhotosPageProps) {
  const { slug } = await params;

  const response = await getEntityBySlug(slug);
  const entity = response.data;

  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-xl border bg-black p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold">
              Photos
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Photos from {entity.name}
            </p>
          </div>

          <button
            type="button"
            className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
          >
            + Add Photos
          </button>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {entity.coverPhoto && (
            <div className="overflow-hidden rounded-lg border">
              <img
                src={entity.coverPhoto}
                alt={`${entity.name} cover`}
                className="h-56 w-full object-cover"
              />
            </div>
          )}

          {entity.logo && (
            <div className="overflow-hidden rounded-lg border">
              <img
                src={entity.logo}
                alt={`${entity.name} logo`}
                className="h-56 w-full object-contain bg-gray-50 p-4"
              />
            </div>
          )}

          {!entity.coverPhoto && !entity.logo && (
            <div className="col-span-full rounded-lg border border-dashed p-12 text-center">
              <p className="text-gray-500">
                No photos have been added yet.
              </p>

              <button
                type="button"
                className="mt-4 rounded-lg bg-black px-5 py-2 text-sm font-medium text-white hover:bg-gray-800"
              >
                Add Photos
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}