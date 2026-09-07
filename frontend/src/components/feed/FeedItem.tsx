import Link from 'next/link';
import type { FeedReview } from '@/services/feed.service';

export default function FeedItem({
  review,
}: {
  review: FeedReview;
}) {
  return (
    <div className="rounded-lg border p-5">
      <div className="flex items-center justify-between">
        <Link
          href={`/profile/${encodeURIComponent(
            review.userId,
          )}`}
          className="font-medium hover:underline"
        >
          {review.user.name}
        </Link>
        <p>⭐ {review.rating}</p>
      </div>

      <Link
        href={`/entities/${encodeURIComponent(
          review.entity.slug,
        )}`}
        className="mt-1 block text-sm text-gray-500 hover:underline"
      >
        {review.entity.name}
      </Link>

      <p className="mt-3 text-sm">
        {review.content}
      </p>
    </div>
  );
}