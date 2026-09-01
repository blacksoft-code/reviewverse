
import { getUserProfile } from '@/services/user.service';
import ProfileActions from '@/components/profile/ProfileActions';

type ProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ProfilePage({
  params,
}: ProfilePageProps) {
  const { id } = await params;

  const response = await getUserProfile(id);

  const user = response.data;

  return (
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <section className="overflow-hidden rounded-2xl bg-white shadow-sm">
          <div className="h-48 bg-gray-200 sm:h-64">
            <div className="flex h-full items-center justify-center text-gray-400">
              Cover Photo
            </div>
          </div>

          <div className="px-6 pb-6">
            <div className="-mt-16">
              <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-white bg-gray-200 text-3xl font-bold text-gray-500 shadow">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="mt-4">
              <h1 className="text-3xl font-bold text-gray-900">
                {user.name}
              </h1>

              <p className="mt-1 text-gray-500">
                {user.reviewCount} reviews
              </p>

              <ProfileActions userId={user.id} />
            </div>

            <nav className="mt-8 border-t pt-4">
              <div className="flex flex-wrap gap-6 text-sm font-medium">
                <a
                  href={`/profile/${user.id}`}
                  className="text-black"
                >
                  Reviews
                </a>

                <a
                  href={`/profile/${user.id}/about`}
                  className="text-gray-500 hover:text-black"
                >
                  About
                </a>

                <a
                  href={`/profile/${user.id}/friends`}
                  className="text-gray-500 hover:text-black"
                >
                  Friends
                </a>

                <a
                  href={`/profile/${user.id}/photos`}
                  className="text-gray-500 hover:text-black"
                >
                  Photos
                </a>
              </div>
            </nav>
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Reviews
          </h2>

          <div className="mt-4 space-y-5">
            {user.reviews.length === 0 ? (
              <div className="rounded-xl bg-white p-6 text-gray-500 shadow-sm">
                No reviews yet.
              </div>
            ) : (
              user.reviews.map((review) => (
                <article
                  key={review.id}
                  className="rounded-xl bg-white p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <a
                        href={`/entities/${review.entity.slug}`}
                        className="text-lg font-semibold text-gray-900 hover:underline"
                      >
                        {review.entity.name}
                      </a>

                      <p className="mt-1 text-sm text-gray-500">
                        {review.entity.category.name}
                        {review.entity.location
                          ? ` • ${review.entity.location}`
                          : ''}
                      </p>
                    </div>

                    <time
                      dateTime={review.createdAt}
                      className="text-sm text-gray-500"
                    >
                      {new Date(
                        review.createdAt,
                      ).toLocaleDateString()}
                    </time>
                  </div>

                  <div className="mt-3 text-sm">
                    <span>
                      {'⭐'.repeat(review.rating)}
                    </span>
                  </div>

                  <p className="mt-4 whitespace-pre-wrap text-gray-700">
                    {review.content}
                  </p>

                  <div className="mt-5 flex gap-6 border-t pt-4 text-sm text-gray-500">
                    <button type="button">
                      Like
                    </button>

                    <button type="button">
                      Heart
                    </button>

                    <button type="button">
                      Dislike
                    </button>

                    <button type="button">
                      Comments
                    </button>

                    <button type="button">
                      Share
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
