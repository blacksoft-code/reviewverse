import Link from 'next/link';

type OverviewReview = {
  rating: number;
  // পুরনো (edit-এর আগের) version গুলো গোনা হয় না
  isLatest?: boolean;
};

type ReviewOverviewProps = {
  reviews: OverviewReview[];
  // Backend-এর হিসাব করা average (header-এর rating-এর সাথে মিলে)
  averageRating: number;
  writeReviewHref: string;
};

const STAR_PATH =
  'M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.8 4.8 17.6l1-5.8L1.5 7.7l5.9-.9L10 1.5z';

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-[18px] w-[18px]"
      aria-hidden="true"
    >
      <path
        d={STAR_PATH}
        fill={filled ? '#f5a524' : 'none'}
        stroke="#f5a524"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// "Customer Reviews" overview — rating-এর summary, ১–৫ star-এর distribution আর
// তার নিচে "Write a Review" বাটন
export default function ReviewOverview({
  reviews,
  averageRating,
  writeReviewHref,
}: ReviewOverviewProps) {
  const latest = reviews.filter((r) => r.isLatest !== false);
  const total = latest.length;

  const counts: Record<number, number> = {
    1: 0,
    2: 0,
    3: 0,
    4: 0,
    5: 0,
  };

  for (const review of latest) {
    const star = Math.min(5, Math.max(1, Math.round(review.rating)));
    counts[star] += 1;
  }

  const average = averageRating ?? 0;
  const filledStars = Math.round(average);

  return (
    <section className="rounded-xl bg-black p-5 text-white sm:p-6">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">
          Customer Reviews
        </h2>

        <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
          {total} {total === 1 ? 'Review' : 'Reviews'}
        </span>
      </div>

      <div className="mt-5 grid grid-cols-[auto_1fr] items-center gap-6 sm:gap-10">
        {/* বাঁ দিকে — average */}
        <div>
          <p className="text-4xl font-bold leading-none">
            {average.toFixed(1)}
            <span className="text-2xl">/5</span>
          </p>

          <div
            className="mt-2 flex gap-0.5"
            aria-label={`${average.toFixed(1)} out of 5 stars`}
          >
            {[1, 2, 3, 4, 5].map((n) => (
              <Star key={n} filled={n <= filledStars} />
            ))}
          </div>

          <p className="mt-3 text-sm text-white/80">
            Based on {total} {total === 1 ? 'review' : 'reviews'}
          </p>
        </div>

        {/* ডান দিকে — ৫ থেকে ১ star-এর distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = counts[star];
            const percent =
              total > 0 ? (count / total) * 100 : 0;

            return (
              <div
                key={star}
                className="flex items-center gap-3"
                title={`${count} ${count === 1 ? 'review' : 'reviews'}`}
              >
                <span className="w-3 text-sm text-white/90">
                  {star}
                </span>

                <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
                  {count > 0 && (
                    <div
                      className="h-full rounded-full bg-[#f5a524]"
                      // খুব কম হলেও যেন একটু দেখা যায়
                      style={{
                        width: `${Math.max(percent, 2)}%`,
                      }}
                    />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 border-t border-white/10 pt-5">
        <Link
          href={writeReviewHref}
          className="block w-full rounded-2xl bg-[#ececec] py-3.5 text-center text-[15px] font-medium text-[#1d1d1f] transition hover:bg-white"
        >
          Write a Review
        </Link>
      </div>
    </section>
  );
}