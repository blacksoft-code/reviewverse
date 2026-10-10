import { getEntityBySlug } from '@/services/entity.service';
import { getEntityPhotos } from '@/services/media.service';
import PhotosGallery from '@/components/media/PhotosGallery';

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

  const photos = await getEntityPhotos(entity.id);

  return (
    <div className="mt-4 space-y-4">
      <section className="rounded-xl border bg-black p-6">
        <h2 className="text-2xl font-semibold">Photos</h2>

        <p className="mt-1 text-sm text-gray-500">
          Photos from {entity.name} — posts, profile and cover
        </p>

        <PhotosGallery
          photos={photos}
          emptyText={`${entity.name} hasn't shared any photos yet.`}
        />
      </section>
    </div>
  );
}
