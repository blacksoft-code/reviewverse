
import { getUserProfile } from '@/services/user.service';

type FriendsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FriendsPage({
  params,
}: FriendsPageProps) {
  const { id } = await params;

  const response = await getUserProfile(id);
  const user = response.data;

  return (
    <main className="min-h-screen bg-gray-100">

      {/* Header */}
      <section className="bg-black">
        <div className="mx-auto max-w-5xl px-6">

          <div className="flex flex-col gap-5 py-8 sm:flex-row sm:items-center">

            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-gray-200 text-3xl font-bold text-gray-600">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                {user.name}
                <span className="ml-2 text-blue-500">
                  ✓
                </span>
              </h1>

              <p className="mt-2 text-gray-500">
                0 followers · 0 following
              </p>
            </div>

          </div>

          {/* Navigation */}
          <nav className="flex gap-8 border-t">

            <a
              href={`/profile/${user.id}`}
              className="px-1 py-4 text-gray-600 hover:text-black"
            >
              Reviews
            </a>

            <a
              href={`/profile/${user.id}/about`}
              className="px-1 py-4 text-gray-600 hover:text-black"
            >
              About
            </a>

            <a
              href={`/profile/${user.id}/friends`}
              className="border-b-2 border-black px-1 py-4 font-medium"
            >
              Friends
            </a>

            <a
              href={`/profile/${user.id}/photos`}
              className="px-1 py-4 text-gray-600 hover:text-black"
            >
              Photos
            </a>

          </nav>

        </div>
      </section>

      {/* Friends */}
      <section className="mx-auto max-w-5xl px-6 py-8">

        <div className="rounded-xl bg-black p-6 shadow-sm">

          <div className="flex items-center justify-between">

            <div>
              <h2 className="text-2xl font-bold">
                Friends
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Friends of {user.name}
              </p>
            </div>

            <span className="text-sm text-gray-500">
              0 friends
            </span>

          </div>

          {/* Empty State */}
          <div className="py-16 text-center">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-2xl">
              👥
            </div>

            <h3 className="mt-4 text-lg font-semibold">
              No friends yet
            </h3>

            <p className="mt-2 text-sm text-gray-500">
              {user.name} hasn't added any friends yet.
            </p>

          </div>

        </div>

      </section>

    </main>
  );
}
