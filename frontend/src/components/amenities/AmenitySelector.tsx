'use client';

import { useEffect, useState } from 'react';
import {
  Amenity,
  getAmenities,
} from '@/services/amenity.service';

type AmenitySelectorProps = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

// Multiple জায়গায় (add-business form, business edit info tab, ভবিষ্যতে
// আরও যেখানে লাগে) reuse করার জন্য — checkbox UI আর master-list fetch
// এখানেই একবার লেখা, বাকি সব জায়গায় শুধু এই component বসালেই হবে।
export default function AmenitySelector({
  selectedIds,
  onChange,
}: AmenitySelectorProps) {
  const [availableAmenities, setAvailableAmenities] =
    useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAmenities() {
      try {
        const response = await getAmenities();
        setAvailableAmenities(response.data);
      } catch {
        // master list load না হলেও form fill করা আটকাবে না
        setAvailableAmenities([]);
      } finally {
        setLoading(false);
      }
    }

    loadAmenities();
  }, []);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((existing) => existing !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  if (loading) {
    return (
      <p className="mt-1 text-sm text-gray-500">
        Loading amenities…
      </p>
    );
  }

  if (availableAmenities.length === 0) {
    return (
      <p className="mt-1 text-sm text-gray-500">
        No amenities available yet.
      </p>
    );
  }

  return (
    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {availableAmenities.map((amenity) => (
        <label
          key={amenity.id}
          className="flex items-center gap-2 rounded-lg border p-2 text-sm"
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(amenity.id)}
            onChange={() => toggle(amenity.id)}
          />
          {amenity.name}
        </label>
      ))}
    </div>
  );
}