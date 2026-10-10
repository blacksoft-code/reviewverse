import { getUserProfile } from '@/services/user.service';
import { getUserPhotos } from '@/services/media.service';
import PhotosGallery from '@/components/media/PhotosGallery';

type PhotosPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PhotosPage({
  params,
}: PhotosPageProps) {
  const { id } = await params;

  const [response, photos] = await Promise.all([
    getUserProfile(id),
    getUserPhotos(id),
  ]);

  const user = response.data;

  return (
    <section className="rounded-xl bg-black p-6 shadow-sm">
      <h2 className="text-2xl font-bold">Photos</h2>

      <p className="mt-1 text-sm text-gray-500">
        Profile, cover and review photos of {user.name}
      </p>

      <PhotosGallery
        photos={photos}
        emptyText={`${user.name} hasn't shared any photos yet.`}
      />
    </section>
  );
}
