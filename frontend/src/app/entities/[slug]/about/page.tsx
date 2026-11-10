import CopyableId from '@/components/common/CopyableId';
import { getEntityBySlug } from '@/services/entity.service';
import {
  DAY_LABELS,
  getBusinessHours,
} from '@/services/business-hour.service';

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

  const businessHoursResponse = await getBusinessHours(
    entity.id,
  ).catch(() => null);
  const hours = businessHoursResponse?.data.hours ?? [];

  // "Located in" = locationId থেকে full path ("Mirpur, Dhaka, Bangladesh"),
  // "Address" = free-text (বাড়ি/রাস্তা)। দুটো একই হলে একবারই দেখাবে।
  const locatedIn = entity.locationDisplay || null;
  const address =
    entity.location && entity.location !== locatedIn
      ? entity.location
      : null;

  return (
    <div className="mt-4 space-y-4">
      {/* About — user profile-এর About এর মতো label/value style */}
      <section className="rounded-xl bg-black p-6">
        <h2 className="text-2xl font-bold text-white">
          About {entity.name}
        </h2>

        <div className="mt-6 space-y-5">
          {/* Description */}
          <div>
            <p className="text-sm text-gray-500">About</p>
            <p className="mt-1 whitespace-pre-wrap font-medium text-white">
              {entity.description ||
                'No business description has been added yet.'}
            </p>
          </div>

          {/* Category */}
          <div>
            <p className="text-sm text-gray-500">
              Category
            </p>
            <p className="mt-1 font-medium text-white">
              {entity.category.name}
            </p>
          </div>

          {/* Public ID — এটা দিয়ে search করলে সরাসরি এই business আসবে */}
          {entity.publicId && (
            <div>
              <p className="text-sm text-gray-500">
                Business ID
              </p>
              <CopyableId
                value={entity.publicId}
                className="mt-1 font-medium text-white"
              />
            </div>
          )}

          {/* Located in */}
          {locatedIn && (
            <div>
              <p className="text-sm text-gray-500">
                Located in
              </p>
              <p className="mt-1 font-medium text-white">
                {locatedIn}
              </p>

              {entity.googleMapsUrl && (
                <a
                  href={entity.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-blue-400 hover:underline"
                >
                  📍 View on Google Maps
                </a>
              )}
            </div>
          )}

          {/* Address (free-text) */}
          {address && (
            <div>
              <p className="text-sm text-gray-500">
                Address
              </p>
              <p className="mt-1 font-medium text-white">
                {address}
              </p>

              {/* Located in নেই হলে Maps link এখানে */}
              {!locatedIn && entity.googleMapsUrl && (
                <a
                  href={entity.googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 inline-block text-sm text-blue-400 hover:underline"
                >
                  📍 View on Google Maps
                </a>
              )}
            </div>
          )}

          {/* Google Maps link আছে কিন্তু location/address কিছুই নেই */}
          {!locatedIn && !address && entity.googleMapsUrl && (
            <div>
              <p className="text-sm text-gray-500">
                Location
              </p>
              <a
                href={entity.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block font-medium text-blue-400 hover:underline"
              >
                📍 View on Google Maps
              </a>
            </div>
          )}

          {/* Phone */}
          {entity.phone && (
            <div>
              <p className="text-sm text-gray-500">
                Phone
              </p>
              <a
                href={`tel:${entity.phone}`}
                className="mt-1 block font-medium text-blue-400 hover:underline"
              >
                {entity.phone}
              </a>
            </div>
          )}

          {/* Website */}
          {entity.website && (
            <div>
              <p className="text-sm text-gray-500">
                Website
              </p>
              <a
                href={entity.website}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 block break-all font-medium text-blue-400 hover:underline"
              >
                {entity.website}
              </a>
            </div>
          )}

          {/* Email */}
          {entity.email && (
            <div>
              <p className="text-sm text-gray-500">
                Email
              </p>
              <a
                href={`mailto:${entity.email}`}
                className="mt-1 block font-medium text-blue-400 hover:underline"
              >
                {entity.email}
              </a>
            </div>
          )}

          {/* Member since */}
          {entity.createdAt && (
            <div>
              <p className="text-sm text-gray-500">
                On Review Verse since
              </p>
              <p className="mt-1 font-medium text-white">
                {new Date(
                  entity.createdAt,
                ).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                })}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* Business Hours */}
      <section className="rounded-xl bg-black p-6">
        <h2 className="text-2xl font-semibold text-white">
          Business Hours
        </h2>

        {hours.length === 0 ? (
          <p className="mt-4 text-gray-400">
            Business hours have not been added yet.
          </p>
        ) : (
          <div className="mt-4 divide-y divide-gray-800">
            {DAY_LABELS.map((label, dayOfWeek) => {
              const day = hours.find(
                (h) => h.dayOfWeek === dayOfWeek,
              );

              return (
                <div
                  key={dayOfWeek}
                  className="flex items-center justify-between py-2 text-sm"
                >
                  <span className="text-gray-300">
                    {label}
                  </span>

                  {!day ? (
                    <span className="text-gray-500">
                      Not set
                    </span>
                  ) : day.isClosed ? (
                    <span className="text-red-400">
                      Closed
                    </span>
                  ) : (
                    <span className="text-gray-400">
                      {day.openTime} – {day.closeTime}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
