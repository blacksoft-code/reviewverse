import { getEntityBySlug } from '@/services/entity.service';
import EntityHeader from '@/components/entities/EntityHeader';
import BlockGuard from '@/components/blocks/BlockGuard';

type EntityLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function EntityLayout({
  children,
  params,
}: EntityLayoutProps) {
  const { slug } = await params;

  const response = await getEntityBySlug(slug);

  const entity = response.data as {
    id: string;
    slug: string;
    name: string;
    coverPhoto: string | null;
    logo: string | null;
    googleMapsUrl?: string | null;
    showBlueBadge?: boolean;
    averageRating: number;
    category: { name: string };
    reviews: unknown[];
  };

  return (
    <BlockGuard kind="entity" id={entity.id}>
    <main className="min-h-screen bg-gray-100">
      <EntityHeader
        entity={{
          id: entity.id,
          slug: entity.slug,
          name: entity.name,
          coverPhoto: entity.coverPhoto,
          logo: entity.logo,
          showBlueBadge: entity.showBlueBadge ?? false,
          averageRating: entity.averageRating,
          reviewCount: entity.reviews?.length ?? 0,
          category: entity.category,
          googleMapsUrl: entity.googleMapsUrl ?? null,
        }}
      />

      <div className="mx-auto max-w-6xl px-4 pb-8 sm:px-6">
        {children}
      </div>
    </main>
    </BlockGuard>
  );
}