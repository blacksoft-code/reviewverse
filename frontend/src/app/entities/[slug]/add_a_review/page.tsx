'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { getEntityBySlug } from '@/services/entity.service';
import ReviewForm from '@/components/reviews/ReviewForm';

type Entity = {
  id: string;
  name: string;
  slug: string;
  location?: string;
  averageRating: number;
  category: {
    id: string;
    name: string;
    slug: string;
  };
};

export default function WriteReviewPage() {
  const params = useParams();
  const router = useRouter();

  const slug = params.slug as string;

  const [entity, setEntity] = useState<Entity | null>(
    null,
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadEntity() {
      try {
        const response = await getEntityBySlug(slug);

        setEntity(response.data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load business',
        );
      } finally {
        setLoading(false);
      }
    }

    if (slug) {
      loadEntity();
    }
  }, [slug]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-2xl">
          <p className="text-gray-500">
            Loading business...
          </p>
        </div>
      </main>
    );
  }

  if (error || !entity) {
    return (
      <main className="min-h-screen bg-gray-50 p-8">
        <div className="mx-auto max-w-2xl">

          <Link
            href={`/entities/${slug}`}
            className="text-sm text-gray-500 hover:text-black"
          >
            ← Back to business
          </Link>

          <div className="mt-6 rounded-xl border bg-white p-6">
            <h1 className="text-xl font-semibold">
              Business not found
            </h1>

            <p className="mt-2 text-sm text-red-600">
              {error || 'Unable to load this business.'}
            </p>
          </div>

        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">

        {/* Back */}
        <Link
          href={`/entities/${entity.slug}`}
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Back to {entity.name}
        </Link>

        {/* Business Header */}
        <section className="mt-6 rounded-xl border bg-black p-6">

          <p className="text-sm text-gray-500">
            {entity.category.name}
          </p>

          <h1 className="mt-2 text-3xl font-bold">
            Write a Review for {entity.name}
          </h1>

          {entity.location && (
            <p className="mt-2 text-sm text-gray-500">
              📍 {entity.location}
            </p>
          )}

          <div className="mt-4 flex items-center gap-2">
            <span className="text-lg">
              ⭐ {entity.averageRating}
            </span>

            <span className="text-sm text-gray-500">
              Overall Rating
            </span>
          </div>

        </section>

        {/* Review Form */}
        <section className="mt-6 rounded-xl border bg-black p-6">

          <ReviewForm
            entityId={entity.id}
            onReviewCreated={() => {
              router.push(
                `/entities/${entity.slug}`,
              );

              router.refresh();
            }}
          />

        </section>

      </div>
    </main>
  );
}