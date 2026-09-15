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
    <div className="mt-4">
      <EntityPublicPostsFeed entityId={entity.id} />
    </div>
  );
}