import { getEntityBySlug } from '@/services/entity.service';
import { getOfferingsByEntity } from '@/services/offering.service';

type ServicesPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

function StarIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5 fill-[#ff9f0a]"
      aria-hidden="true"
    >
      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.8 4.8 17.6l1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
    </svg>
  );
}

export default async function ServicesPage({
  params,
}: ServicesPageProps) {
  const { slug } = await params;

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
          <ul className="divide-y divide-black/5 border-t border-black/5 dark:divide-white/10 dark:border-white/10">
            {offerings.map((offering) => (
              <li
                key={offering.id}
                className="flex items-start gap-4 px-6 py-5 transition-colors hover:bg-black/[0.02] dark:hover:bg-white/[0.03] sm:px-8"
              >
                {offering.media[0]?.url && (
                  <img
                    src={offering.media[0].url}
                    alt={offering.name}
                    className="h-24 w-24 flex-shrink-0 rounded-2xl object-cover ring-1 ring-black/5 dark:ring-white/10"
                  />
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <h3 className="truncate text-[17px] font-semibold tracking-tight">
                        {offering.name}
                      </h3>

                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="rounded-full bg-[#f5f5f7] px-2.5 py-0.5 text-xs font-medium text-[#6e6e73] dark:bg-white/10 dark:text-[#98989d]">
                          {offering.type}
                        </span>

                        {offering.averageRating > 0 && (
                          <span className="flex items-center gap-1 text-[13px] font-medium text-[#6e6e73] dark:text-[#98989d]">
                            <StarIcon />
                            {offering.averageRating.toFixed(1)}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="whitespace-nowrap text-[17px] font-semibold tracking-tight">
                      ৳{offering.price}
                    </span>
                  </div>

                  {offering.description && (
                    <p className="mt-3 max-w-prose whitespace-pre-line text-[15px] leading-6 text-[#6e6e73] dark:text-[#98989d]">
                      {offering.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
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