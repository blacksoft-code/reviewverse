'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import {
  getUserProfile,
  updateUserInfo,
  Gender,
} from '@/services/user.service';
import UserLocationPicker from '@/components/locations/UserLocationPicker';
import WorksAtPicker from '@/components/entities/WorksAtPicker';

type EditableUser = {
  id: string;
  name: string;
  worksAtEntityId: string | null;
  worksAtDisplay: string | null;
  studiesAt: string | null;
  livesInLocationId: string | null;
  livesInDisplay: string | null;
  fromLocationId: string | null;
  fromDisplay: string | null;
  birthday: string | null;
  gender: Gender | null;
  bio: string | null;
};

// পেজের একদম উপরে pfp/cover photo দেখা যায় এবং বদলানো যায় — সেটা এই
// পেজের নিজের কোড না, বরং ProfileHeader (layout.tsx-এ সব profile
// sub-page-এর উপরে common থাকে, নিজের ভেতরেই SingleImageUploader দিয়ে
// avatar/cover edit করার সুবিধা দেয়)। তাই এই পেজে শুধু info ফর্ম।
export default function EditProfilePage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.id as string;

  const { user: currentUser, loading: authLoading } =
    useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    worksAtEntityId: '',
    studiesAt: '',
    livesInLocationId: '',
    fromLocationId: '',
    birthday: '',
    gender: '' as Gender | '',
    bio: '',
  });

  // UserLocationPicker-দুটোর input প্রথমবার pre-fill করার জন্য
  const [livesInInitialDisplay, setLivesInInitialDisplay] =
    useState<string | null>(null);
  const [fromInitialDisplay, setFromInitialDisplay] =
    useState<string | null>(null);
  const [
    worksAtInitialDisplay,
    setWorksAtInitialDisplay,
  ] = useState<string | null>(null);

  // নিজের প্রোফাইল না হলে এই পেজে থাকার দরকার নেই
  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      router.push('/login');
      return;
    }

    if (currentUser.id !== profileId) {
      router.push(`/profile/${profileId}`);
    }
  }, [authLoading, currentUser, profileId, router]);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const response = await getUserProfile(profileId);
        const data = response.data as EditableUser;

        setForm({
          worksAtEntityId: data.worksAtEntityId ?? '',
          studiesAt: data.studiesAt ?? '',
          livesInLocationId: data.livesInLocationId ?? '',
          fromLocationId: data.fromLocationId ?? '',
          birthday: data.birthday
            ? data.birthday.slice(0, 10)
            : '',
          gender: data.gender ?? '',
          bio: data.bio ?? '',
        });
        setLivesInInitialDisplay(
          data.livesInDisplay ?? null,
        );
        setFromInitialDisplay(
          data.fromDisplay ?? null,
        );
        setWorksAtInitialDisplay(
          data.worksAtDisplay ?? null,
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load profile.',
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [profileId]);

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSaved(false);

    try {
      await updateUserInfo({
        worksAtEntityId:
          form.worksAtEntityId || undefined,
        studiesAt: form.studiesAt,
        livesInLocationId:
          form.livesInLocationId || undefined,
        fromLocationId:
          form.fromLocationId || undefined,
        birthday: form.birthday || undefined,
        gender: form.gender || undefined,
        bio: form.bio,
      });

      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save changes.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return <p className="text-gray-500">Loading...</p>;
  }

  return (
    <div className="max-w-2xl rounded-xl bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-900">
        Edit Profile Info
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Profile আর cover photo উপরে ছবির উপর hover করে বদলাও।
        এখানে নিচে তোমার about info আপডেট করো।
      </p>

      {error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {saved && (
        <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Profile updated.
        </p>
      )}

      <form
        onSubmit={handleSave}
        className="mt-6 space-y-4"
      >
        <div>
          <label className="text-sm text-gray-500">
            Works at
          </label>
          <WorksAtPicker
            initialDisplayName={worksAtInitialDisplay}
            onChange={(entityId) =>
              setForm((f) => ({
                ...f,
                worksAtEntityId: entityId ?? '',
              }))
            }
          />
        </div>

        <div>
          <label className="text-sm text-gray-500">
            Studies at
          </label>
          <input
            value={form.studiesAt}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                studiesAt: e.target.value,
              }))
            }
            placeholder="e.g. University of Dhaka"
            className="mt-1 w-full rounded-lg border p-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-gray-500">
            Lives in
          </label>
          <UserLocationPicker
            initialDisplayName={livesInInitialDisplay}
            onChange={(locationId) =>
              setForm((f) => ({
                ...f,
                livesInLocationId: locationId ?? '',
              }))
            }
          />
        </div>

        <div>
          <label className="text-sm text-gray-500">
            From
          </label>
          <UserLocationPicker
            initialDisplayName={fromInitialDisplay}
            onChange={(locationId) =>
              setForm((f) => ({
                ...f,
                fromLocationId: locationId ?? '',
              }))
            }
          />
        </div>

        <div>
          <label className="text-sm text-gray-500">
            Birthday
          </label>
          <input
            type="date"
            value={form.birthday}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                birthday: e.target.value,
              }))
            }
            className="mt-1 w-full rounded-lg border p-2.5 text-sm"
          />
        </div>

        <div>
          <label className="text-sm text-gray-500">
            Gender
          </label>
          <select
            value={form.gender}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                gender: e.target.value as Gender | '',
              }))
            }
            className="mt-1 w-full rounded-lg border p-2.5 text-sm"
          >
            <option value="">Select gender</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
            <option value="PREFER_NOT_TO_SAY">
              Prefer not to say
            </option>
          </select>
        </div>

        <div>
          <label className="text-sm text-gray-500">
            About / Bio
          </label>
          <textarea
            value={form.bio}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                bio: e.target.value,
              }))
            }
            rows={4}
            maxLength={500}
            placeholder="Tell people a bit about yourself..."
            className="mt-1 w-full resize-none rounded-lg border p-2.5 text-sm"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>

          <button
            type="button"
            onClick={() =>
              router.push(`/profile/${profileId}`)
            }
            className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-gray-50"
          >
            Done
          </button>
        </div>
      </form>
    </div>
  );
}