'use client';

import { useEffect, useState } from 'react';

import {
  FriendListVisibility,
  getFriendPrivacy,
  updateFriendPrivacy,
} from '@/services/user.service';

const OPTIONS: {
  value: FriendListVisibility;
  label: string;
}[] = [
  { value: 'PUBLIC', label: 'Public' },
  { value: 'FRIENDS', label: 'Only friends' },
  { value: 'PRIVATE', label: 'Only me' },
];

export default function FriendListPrivacy() {
  const [value, setValue] =
    useState<FriendListVisibility | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await getFriendPrivacy();
        setValue(response.data.friendListVisibility);
      } catch {
        // privacy setting না এলে selector দেখানো হবে না
      }
    }

    load();
  }, []);

  const handleChange = async (
    next: FriendListVisibility,
  ) => {
    const previous = value;

    try {
      setSaving(true);
      setValue(next);

      await updateFriendPrivacy(next);
    } catch (error) {
      setValue(previous);

      alert(
        error instanceof Error
          ? error.message
          : 'Something went wrong',
      );
    } finally {
      setSaving(false);
    }
  };

  if (!value) return null;

  return (
    <div className="mb-5 flex items-center gap-3">
      <label
        htmlFor="friend-list-privacy"
        className="text-sm text-gray-600"
      >
        Who can see your friend list
      </label>

      <select
        id="friend-list-privacy"
        value={value}
        disabled={saving}
        onChange={(e) =>
          handleChange(
            e.target.value as FriendListVisibility,
          )
        }
        className="rounded-lg border px-3 py-1.5 text-sm text-gray-900 disabled:opacity-50"
      >
        {OPTIONS.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
