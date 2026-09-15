
import { getEntityBySlug } from '@/services/entity.service';

type AboutPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function AboutPage({
  params,
}: AboutPageProps) {
  const { slug } = await params;

  const response = await getEntityBySlug(slug);
  const entity = response.data;

  return (
    <div className="mt-4 space-y-4">
      {/* About */}
      <section className="rounded-xl bg-black p-6">
        <h2 className="text-2xl font-semibold text-white">
          About
        </h2>

        <div className="mt-5 space-y-6">
          {/* Description */}
          <div>
            <h3 className="font-semibold text-white">
              About this business
            </h3>

            <p className="mt-2 leading-7 text-gray-400">
              {entity.description ||
                'No business description has been added yet.'}
            </p>
          </div>

          {/* Location */}
          <div>
            <h3 className="font-semibold text-white">
              Location
            </h3>

            <p className="mt-2 text-gray-400">
              {entity.location || 'Not provided'}
            </p>
          </div>

          {/* Phone */}
          <div>
            <h3 className="font-semibold text-white">
              Phone
            </h3>

            {entity.phone ? (
              <a
                href={`tel:${entity.phone}`}
                className="mt-2 block text-blue-400 hover:underline"
              >
                {entity.phone}
              </a>
            ) : (
              <p className="mt-2 text-gray-500">
                Not provided
              </p>
            )}
          </div>

          {/* Website */}
          <div>
            <h3 className="font-semibold text-white">
              Website
            </h3>

            {entity.website ? (
              <a
                href={entity.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 block break-all text-blue-400 hover:underline"
              >
                {entity.website}
              </a>
            ) : (
              <p className="mt-2 text-gray-500">
                Not provided
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <h3 className="font-semibold text-white">
              Email
            </h3>

            {entity.email ? (
              <a
                href={`mailto:${entity.email}`}
                className="mt-2 block text-blue-400 hover:underline"
              >
                {entity.email}
              </a>
            ) : (
              <p className="mt-2 text-gray-500">
                Not provided
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Business Hours */}
      <section className="rounded-xl bg-black p-6">
        <h2 className="text-2xl font-semibold text-white">
          Business Hours
        </h2>

        <p className="mt-4 whitespace-pre-line text-gray-400">
          {entity.businessHours ||
            'Business hours have not been added yet.'}
        </p>
      </section>
    </div>
  );
}

