import { getUserProfile } from '@/services/user.service';

type PhotosPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function PhotosPage({
  params,
}: PhotosPageProps) {
  const { id } = await params;

  const response = await getUserProfile(id);
  const user = response.data;

  return (
    <section className="rounded-xl bg-black p-6 shadow-sm">
      <h2 className="text-2xl font-bold">Photos</h2>

      <p className="mt-1 text-sm text-gray-500">
        Photos shared by {user.name}
      </p>

      <div className="py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
          📷
        </div>

        <h3 className="mt-4 text-lg font-semibold">
          No photos yet
        </h3>

        <p className="mt-2 text-sm text-gray-500">
          {user.name} hasn't shared any photos yet.
        </p>
      </div>
    </section>
  );
}