'use client';

import { useState } from 'react';

import BlockedUsersList from '@/components/profile/BlockedUsersList';
import BlockedEntitiesList from '@/components/profile/BlockedEntitiesList';

// Blocked tab-এর ভেতরে দুইটা অংশ — মানুষ আর business
export default function BlockedContent() {
  const [section, setSection] = useState<
    'people' | 'businesses'
  >('people');

  const pill = (active: boolean) =>
    `rounded-full px-4 py-1.5 text-sm font-medium ${
      active
        ? 'bg-black text-white'
        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    }`;

  return (
    <div className="mt-6">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setSection('people')}
          className={pill(section === 'people')}
        >
          People
        </button>

        <button
          type="button"
          onClick={() => setSection('businesses')}
          className={pill(section === 'businesses')}
        >
          Businesses
        </button>
      </div>

      {section === 'people' ? (
        <BlockedUsersList />
      ) : (
        <BlockedEntitiesList />
      )}
    </div>
  );
}
