
import { getUserProfile } from '@/services/user.service';

type AboutPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function AboutPage({
  params,
}: AboutPageProps) {
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
                {user.reviewCount} reviews
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
              className="border-b-2 border-black px-1 py-4 font-medium"
            >
              About
            </a>

            <a
              href={`/profile/${user.id}/friends`}
              className="px-1 py-4 text-gray-600 hover:text-black"
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

      {/* About Content */}
      <section className="mx-auto max-w-5xl px-6 py-8">

        <div className="max-w-3xl rounded-xl bg-black p-6 shadow-sm">

          <h2 className="text-2xl font-bold">
            About {user.name}
          </h2>

          <div className="mt-6 space-y-5">

            <div>
              <p className="text-sm text-gray-500">
                Name
              </p>

              <p className="mt-1 font-medium">
                {user.name}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Reviews
              </p>

              <p className="mt-1 font-medium">
                {user.reviewCount}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-500">
                Member since
              </p>

              <p className="mt-1 font-medium">
                {new Date(
                  user.createdAt,
                ).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>

          </div>

        </div>

      </section>

    </main>
  );
}
