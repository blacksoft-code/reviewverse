import Link from 'next/link';

import { getEntityBySlug } from '@/services/entity.service';
import EntityPublicPostsFeed from '@/components/entities/posts/EntityPublicPostsFeed';

type EntityPostsPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function EntityPostsPage({
  params,
}: EntityPostsPageProps) {
  const { slug } = await params;

  const response = await getEntityBySlug(slug);
  const entity = response.data;

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/entities/${slug}`}
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Back to business
        </Link>

        <h1 className="mt-4 text-2xl font-bold">
          Posts from {entity.name}
        </h1>

        <div className="mt-6">
          <EntityPublicPostsFeed entityId={entity.id} />
        </div>
      </div>
    </main>
  );
}