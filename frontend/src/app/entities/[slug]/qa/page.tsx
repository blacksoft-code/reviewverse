import { getEntityBySlug } from '@/services/entity.service';
import EntityQASection from '@/components/entities/qa/EntityQASection';

type QAPageProps = {
  params: Promise<{
    slug: string;
  }>;
  searchParams: Promise<{
    questionId?: string;
  }>;
};

export default async function QAPage({
  params,
  searchParams,
}: QAPageProps) {
  const { slug } = await params;
  const { questionId } = await searchParams;

  const response = await getEntityBySlug(slug);
  const entity = response.data;

  return (
    <div className="mt-4">
      <EntityQASection
        entityId={entity.id}
        entityName={entity.name}
        focusQuestionId={questionId}
      />
    </div>
  );
}
