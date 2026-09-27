import Link from 'next/link';

import { OfferingSearchResult } from '@/services/entity.service';

type OfferingCardProps = {
  offering: OfferingSearchResult;
};

// offering-type search result card — "Best hospital" (category search)
// এখনো আগের entity-card ব্যবহার করে, এটা শুধু offering-type search
// (যেমন "Best juice in Dhaka") এর জন্য — প্রতিটা matching offering
// নিজের card হিসেবে দেখানো হয়।
export default function OfferingCard({
  offering,
}: OfferingCardProps) {
  return (
    <Link
      href={`/entities/${encodeURIComponent(
        offering.entity.slug,
      )}`}
      className="overflow-hidden rounded-xl border bg-white transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="aspect-video w-full bg-gray-100">
        {offering.image ? (
          <img
            src={offering.image}
            alt={offering.name}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-sm text-gray-400">
            No image
          </div>
        )}
      </div>

      <div className="p-5">
        <p className="text-sm font-medium text-gray-500">
          {offering.type}
        </p>

        <h3 className="mt-1 text-xl font-semibold text-black">
          {offering.name}
        </h3>

        <p className="mt-1 text-sm text-gray-600">
          {offering.entity.name}
        </p>

        {offering.entity.location && (
          <p className="mt-1 text-sm text-gray-500">
            📍 {offering.entity.location}
          </p>
        )}

        <div className="mt-3 flex items-center justify-between">
          <p className="text-sm font-medium text-black">
            ⭐ {offering.averageRating.toFixed(1)}
          </p>

          <p className="text-sm font-medium text-black">
            ৳{offering.price}
          </p>
        </div>

        <p className="mt-2 text-xs text-gray-500">
          {offering.reviewCount > 0
            ? `${offering.reviewCount} reviewed`
            : 'No reviews yet'}
        </p>
      </div>
    </Link>
  );
}