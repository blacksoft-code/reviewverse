
import { getUserProfile } from '@/services/user.service';

type ProfilePageProps = {
  params: Promise<{
    id: string;
  }>;
};

function formatDate(date: string) {
  return new Date(date).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  );
}

function renderStars(rating: number) {
  return '★'.repeat(rating) + '☆'.repeat(5 - rating);
}

export default async function ProfilePage({
  params,
}: ProfilePageProps) {
  const { id } = await params;

  const response = await getUserProfile(id);
  const user = response.data;

  return (
    <main className="min-h-screen bg-gray-100">

      {/* ========================= */}
      {/* PROFILE HEADER */}
      {/* ========================= */}

      <section className="bg-black">

        {/* Cover Photo */}
        <div className="h-64 bg-gradient-to-r from-gray-700 via-gray-500 to-gray-400" />

        <div className="mx-auto max-w-5xl px-6">

          {/* Profile Info */}
          <div className="relative flex flex-col gap-5 pb-6 sm:flex-row sm:items-end">

            {/* Profile Picture */}
            <div className="-mt-20 flex h-36 w-36 shrink-0 items-center justify-center rounded-full border-4 border-white bg-gray-200 text-4xl font-bold text-gray-600 shadow">
              {user.name.charAt(0).toUpperCase()}
            </div>

            {/* User Info */}
            <div className="flex-1">

              <h1 className="text-3xl font-bold">
                {user.name}
                <span className="ml-2 text-blue-500">
                  ✓
                </span>
              </h1>

              <p className="mt-1 text-gray-600">
                {user.reviewCount} reviews
              </p>

              <p className="mt-2 text-sm text-gray-500">
                0 followers · 0 following
              </p>

            </div>

            {/* Actions */}
            <div className="flex gap-2">

              <button
                type="button"
                className="rounded-lg bg-black px-5 py-2.5 font-medium text-white hover:bg-gray-800"
              >
                Add Friend
              </button>

              <button
                type="button"
                className="rounded-lg border px-5 py-2.5 font-medium hover:bg-gray-50"
              >
                Message
              </button>

              <button
                type="button"
                className="rounded-lg border px-4 py-2.5 font-medium hover:bg-gray-50"
              >
                More
              </button>

            </div>

          </div>

          {/* Navigation */}
          <nav className="flex gap-8 border-t">

            <a
              href={`/profile/${user.id}`}
              className="border-b-2 border-black px-1 py-4 font-medium"
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

      {/* ========================= */}
      {/* CONTENT */}
      {/* ========================= */}

      <section className="mx-auto max-w-5xl px-6 py-8">

        <div className="grid gap-6 lg:grid-cols-3">

          {/* Left Sidebar */}
          <aside className="space-y-6">

            {/* About */}
            <div className="rounded-xl bg-black p-6 shadow-sm">

              <h2 className="text-xl font-semibold">
                About
              </h2>

              <p className="mt-3 text-sm text-gray-600">
                {user.name} has written{' '}
                {user.reviewCount} reviews on
                ReviewVerse.
              </p>

            </div>

            {/* Stats */}
            <div className="rounded-xl bg-black p-6 shadow-sm">

              <h2 className="text-xl font-semibold">
                Activity
              </h2>

              <div className="mt-4 space-y-3 text-sm">

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Reviews
                  </span>

                  <span className="font-medium">
                    {user.reviewCount}
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Followers
                  </span>

                  <span className="font-medium">
                    666k
                  </span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-500">
                    Following
                  </span>

                  <span className="font-medium">
                    20
                  </span>
                </div>

              </div>

            </div>

          </aside>

          {/* Reviews */}
          <div className="lg:col-span-2  bg-[#222222]">

            <div className="mb-5 flex items-center justify-between">

              <h2 className="text-2xl font-bold">
                Reviews
              </h2>

              <span className="text-sm text-gray-500">
                {user.reviewCount} reviews
              </span>

            </div>

            {user.reviews.length === 0 ? (
              <div className="rounded-xl bg-white p-8 text-center shadow-sm">

                <p className="text-gray-500">
                  This user has not written any
                  reviews yet.
                </p>

              </div>
            ) : (
              <div className="space-y-5">

                {user.reviews.map((review) => (

                  <article
                    key={review.id}
                    className="rounded-xl bg-black p-6 shadow-sm"
                  >

                    {/* Entity Header */}
                    <div className="flex items-start gap-4">

                      {/* Entity Image Placeholder */}
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-200 text-lg font-bold text-gray-500">
                        {review.entity.name
                          .charAt(0)
                          .toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1">

                        <a
                          href={`/entities/${review.entity.slug}`}
                          className="text-lg font-semibold hover:underline"
                        >
                          {review.entity.name}
                        </a>

                        <p className="text-sm text-gray-500">
                          {review.entity.category.name}
                          {review.entity.location
                            ? ` · ${review.entity.location}`
                            : ''}
                        </p>

                        {/* Rating + Date */}
                        <div className="mt-2 flex flex-wrap items-center gap-3">

                          <span className="text-sm tracking-wide text-yellow-500">
                            {renderStars(
                              review.rating,
                            )}
                          </span>

                          <span className="text-sm text-gray-400">
                            {formatDate(
                              review.createdAt,
                            )}
                          </span>

                        </div>

                      </div>

                    </div>

                    {/* Review Content */}
                    <div className="mt-5">

                      <p className="whitespace-pre-wrap text-gray-800">
                        {review.content}
                      </p>

                    </div>

                    {/* Review Photos Placeholder */}
                    <div className="mt-5 hidden grid-cols-2 gap-3 sm:grid-cols-3">

                      {/* Future review photos will appear here */}

                    </div>

                    {/* Actions */}
                    <div className="mt-6 flex items-center gap-5 border-t pt-4 text-sm text-gray-500">

                      <button
                        type="button"
                        className="hover:text-black"
                      >
                        👍 Like
                      </button>

                      <button
                        type="button"
                        className="hover:text-black"
                      >
                        ❤️ Love
                      </button>

                      <button
                        type="button"
                        className="hover:text-black"
                      >
                        👎 Dislike
                      </button>

                      <button
                        type="button"
                        className="hover:text-black"
                      >
                        💬 Comments
                      </button>

                      <button
                        type="button"
                        className="hover:text-black"
                      >
                        Share
                      </button>

                    </div>

                  </article>

                ))}

              </div>
            )}

          </div>

        </div>

      </section>

    </main>
  );
}
