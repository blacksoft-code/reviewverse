import { getEntityBySlug } from '@/services/entity.service';
import { getOfferingsByEntity } from '@/services/offering.service';
import ServicesList from '@/components/offerings/ServicesList';

type ServicesPageProps = {
  params: Promise<{
    slug: string;
  }>;
  // Search result card থেকে এলে ?offering=<id>
  searchParams: Promise<{
    offering?: string;
  }>;
};

export default async function ServicesPage({
  params,
  searchParams,
}: ServicesPageProps) {
  const { slug } = await params;
  const { offering: highlightId } = await searchParams;

  const response = await getEntityBySlug(slug);
  const entity = response.data;

  const offeringsResponse = await getOfferingsByEntity(
    entity.id,
  );
  const offerings = offeringsResponse.data;

  return (
    <div className="mt-4 space-y-6 text-[#1d1d1f] antialiased dark:text-[#f5f5f7]">
      {/* Offerings */}
      <section className="overflow-hidden rounded-3xl bg-white ring-1 ring-black/5 dark:bg-[#1c1c1e] dark:ring-white/10">
        <header className="px-6 pb-4 pt-7 sm:px-8">
          <h2 className="text-[28px] font-semibold tracking-tight">
            Offerings
          </h2>

          <p className="mt-1 text-[15px] text-[#6e6e73] dark:text-[#98989d]">
            What {entity.name} offers
          </p>
        </header>

        {offerings.length === 0 ? (
          <div className="px-6 pb-12 pt-6 text-center sm:px-8">
            <p className="text-[15px] text-[#6e6e73] dark:text-[#98989d]">
              No offerings have been added yet.
            </p>
          </div>
        ) : (
          <ServicesList
            offerings={offerings}
            highlightId={highlightId}
          />
        )}
      </section>

      {/* Price range */}
      <section className="rounded-3xl bg-white px-6 py-6 ring-1 ring-black/5 dark:bg-[#1c1c1e] dark:ring-white/10 sm:px-8">
        <h2 className="text-xl font-semibold tracking-tight">
          Price Range
        </h2>

        <p className="mt-2 text-[15px] text-[#6e6e73] dark:text-[#98989d]">
          {entity.priceRange || 'Not provided'}
        </p>
      </section>
    </div>
  );
}