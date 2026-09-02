import Link from 'next/link';
import {
  getEntityBySlug,
  getEntityFollowers,
} from '@/services/entity.service';

export default async function EntityFollowersPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const entityResult = await getEntityBySlug(slug);
  const entity = entityResult.data;

  const followersResult = await getEntityFollowers(entity.id);
  const followers = followersResult.data;

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <div className="mb-8">
        <Link
          href={`/entities/${slug}`}
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Back to {entity.name}
        </Link>

        <h1 className="mt-4 text-2xl font-semibold">
          {entity.name} followers
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          {followers.length} followers
        </p>
      </div>

      <div className="divide-y rounded-xl border">
        {followers.length === 0 ? (
          <div className="p-6 text-center text-sm text-gray-500">
            No followers yet.
          </div>
        ) : (
          followers.map((follower) => (
            <div
              key={follower.id}
              className="flex items-center gap-4 p-4"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200 text-sm font-medium">
                {follower.user.name.charAt(0).toUpperCase()}
              </div>

              <div>
                <p className="font-medium">
                  {follower.user.name}
                </p>

                <p className="text-xs text-gray-500">
                  Followed on{' '}
                  {new Date(
                    follower.createdAt,
                  ).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}