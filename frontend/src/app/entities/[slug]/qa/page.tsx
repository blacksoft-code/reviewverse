
import { getEntityBySlug } from '@/services/entity.service';

type QAPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function QAPage({
  params,
}: QAPageProps) {
  const { slug } = await params;

  const response = await getEntityBySlug(slug);
  const entity = response.data;

  return (
    <div className="mt-4">
      {/* Q&A */}
      <section className="rounded-xl bg-black p-6">
        <h2 className="text-2xl font-semibold text-white">
          Questions & Answers
        </h2>

        <p className="mt-1 text-sm text-gray-400">
          Ask questions about {entity.name} and help other
          people learn more about this business.
        </p>

        {/* Ask Question */}
        <div className="mt-6 rounded-lg border border-gray-700 p-5">
          <h3 className="font-semibold text-white">
            Have a question?
          </h3>

          <p className="mt-1 text-sm text-gray-400">
            Ask something about this business.
          </p>

          <button
            type="button"
            className="mt-4 rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-gray-200"
          >
            Ask a Question
          </button>
        </div>

        {/* Empty State */}
        <div className="mt-6 rounded-lg border border-dashed border-gray-700 p-10 text-center">
          <div className="text-3xl text-white">
            ?
          </div>

          <h3 className="mt-3 font-semibold text-white">
            No questions yet
          </h3>

          <p className="mt-1 text-sm text-gray-400">
            Be the first person to ask a question about this
            business.
          </p>
        </div>
      </section>
    </div>
  );
}
