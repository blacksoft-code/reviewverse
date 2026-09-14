'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import {
  getUserProfile,
  updateUserInfo,
  Gender,
} from '@/services/user.service';

type AboutUser = {
  id: string;
  name: string;
  reviewCount: number;
  createdAt: string;
  worksAt: string | null;
  studiesAt: string | null;
  livesIn: string | null;
  from: string | null;
  birthday: string | null;
  gender: Gender | null;
  bio: string | null;
};

const GENDER_LABELS: Record<Gender, string> = {
  MALE: 'Male',
  FEMALE: 'Female',
  OTHER: 'Other',
  PREFER_NOT_TO_SAY: 'Prefer not to say',
};

export default function AboutPage() {
  const params = useParams();
  const profileId = params.id as string;

  const { user: currentUser } = useAuth();
  const isOwnProfile = currentUser?.id === profileId;

  const [user, setUser] = useState<AboutUser | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    worksAt: '',
    studiesAt: '',
    livesIn: '',
    from: '',
    birthday: '',
    gender: '' as Gender | '',
    bio: '',
  });

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const response = await getUserProfile(
          profileId,
        );
        const data = response.data as AboutUser;

        setUser(data);
        setForm({
          worksAt: data.worksAt ?? '',
          studiesAt: data.studiesAt ?? '',
          livesIn: data.livesIn ?? '',
          from: data.from ?? '',
          birthday: data.birthday
            ? data.birthday.slice(0, 10)
            : '',
          gender: data.gender ?? '',
          bio: data.bio ?? '',
        });
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

    try {
      const response = await updateUserInfo({
        worksAt: form.worksAt,
        studiesAt: form.studiesAt,
        livesIn: form.livesIn,
        from: form.from,
        birthday: form.birthday || undefined,
        gender: form.gender || undefined,
        bio: form.bio,
      });

      setUser((prev) =>
        prev
          ? { ...prev, ...(response as { data: AboutUser }).data }
          : prev,
      );
      setEditing(false);
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

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-gray-100 p-8">
        <p className="text-red-600">
          {error || 'Profile not found.'}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100">
      {/* Header */}
      <section className="bg-black">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col gap-5 py-8 sm:flex-row sm:items-center">
            <div className="flex h-28 w-28 shrink-0 items-center justify-center rounded-full bg-gray-200 text-3xl font-bold text-gray-600">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <div>
              <h1 className="text-3xl font-bold">
                {user.name}
                <span className="ml-2 text-blue-500">
                  ✓
                </span>
              </h1>

              <p className="mt-2 text-gray-500">
                {user.reviewCount} reviews
              </p>
            </div>
          </div>

          <nav className="flex gap-8 border-t">
            <a
              href={`/profile/${user.id}`}
              className="px-1 py-4 text-gray-600 hover:text-black"
            >
              Reviews
            </a>

            <a
              href={`/profile/${user.id}/about`}
              className="border-b-2 border-black px-1 py-4 font-medium"
            >
              About
            </a>

            <a
              href={`/profile/${user.id}/friends`}
              className="px-1 py-4 text-gray-600 hover:text-black"
            >
              Friends
            </a>

            <a
              href={`/profile/${user.id}/photos`}
              className="px-1 py-4 text-gray-600 hover:text-black"
            >
              Photos
            </a>
          </nav>
        </div>
      </section>

      {/* About Content */}
      <section className="mx-auto max-w-5xl px-6 py-8">
        <div className="max-w-3xl rounded-xl bg-black p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold">
              About {user.name}
            </h2>

            {isOwnProfile && !editing && (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-800"
              >
                Edit info
              </button>
            )}
          </div>

          {error && (
            <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* ================================= */}
          {/* EDIT MODE */}
          {/* ================================= */}

          {editing ? (
            <form
              onSubmit={handleSave}
              className="mt-6 space-y-4"
            >
              <div>
                <label className="text-sm text-gray-400">
                  Works at
                </label>
                <input
                  value={form.worksAt}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      worksAt: e.target.value,
                    }))
                  }
                  placeholder="e.g. ReviewVerse Inc."
                  className="mt-1 w-full rounded-lg border bg-white p-2.5 text-sm text-black"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400">
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
                  className="mt-1 w-full rounded-lg border bg-white p-2.5 text-sm text-black"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400">
                  Lives in
                </label>
                <input
                  value={form.livesIn}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      livesIn: e.target.value,
                    }))
                  }
                  placeholder="e.g. Dhaka, Bangladesh"
                  className="mt-1 w-full rounded-lg border bg-white p-2.5 text-sm text-black"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400">
                  From
                </label>
                <input
                  value={form.from}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      from: e.target.value,
                    }))
                  }
                  placeholder="e.g. Chittagong, Bangladesh"
                  className="mt-1 w-full rounded-lg border bg-white p-2.5 text-sm text-black"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400">
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
                  className="mt-1 w-full rounded-lg border bg-white p-2.5 text-sm text-black"
                />
              </div>

              <div>
                <label className="text-sm text-gray-400">
                  Gender
                </label>
                <select
                  value={form.gender}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      gender: e.target
                        .value as Gender | '',
                    }))
                  }
                  className="mt-1 w-full rounded-lg border bg-white p-2.5 text-sm text-black"
                >
                  <option value="">
                    Select gender
                  </option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">
                    Female
                  </option>
                  <option value="OTHER">Other</option>
                  <option value="PREFER_NOT_TO_SAY">
                    Prefer not to say
                  </option>
                </select>
              </div>

              <div>
                <label className="text-sm text-gray-400">
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
                  className="mt-1 w-full resize-none rounded-lg border bg-white p-2.5 text-sm text-black"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="rounded-lg bg-white px-5 py-2.5 text-sm font-medium text-black hover:bg-gray-200 disabled:opacity-50"
                >
                  {saving ? 'Saving...' : 'Save'}
                </button>

                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg border px-5 py-2.5 text-sm font-medium hover:bg-gray-800"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : (
            /* ================================= */
            /* VIEW MODE */
            /* ================================= */
            <div className="mt-6 space-y-5">
              {user.bio && (
                <div>
                  <p className="text-sm text-gray-500">
                    About
                  </p>
                  <p className="mt-1 whitespace-pre-wrap font-medium">
                    {user.bio}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500">
                  Name
                </p>
                <p className="mt-1 font-medium">
                  {user.name}
                </p>
              </div>

              {user.worksAt && (
                <div>
                  <p className="text-sm text-gray-500">
                    Works at
                  </p>
                  <p className="mt-1 font-medium">
                    {user.worksAt}
                  </p>
                </div>
              )}

              {user.studiesAt && (
                <div>
                  <p className="text-sm text-gray-500">
                    Studies at
                  </p>
                  <p className="mt-1 font-medium">
                    {user.studiesAt}
                  </p>
                </div>
              )}

              {user.livesIn && (
                <div>
                  <p className="text-sm text-gray-500">
                    Lives in
                  </p>
                  <p className="mt-1 font-medium">
                    {user.livesIn}
                  </p>
                </div>
              )}

              {user.from && (
                <div>
                  <p className="text-sm text-gray-500">
                    From
                  </p>
                  <p className="mt-1 font-medium">
                    {user.from}
                  </p>
                </div>
              )}

              {user.birthday && (
                <div>
                  <p className="text-sm text-gray-500">
                    Birthday
                  </p>
                  <p className="mt-1 font-medium">
                    {new Date(
                      user.birthday,
                    ).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
              )}

              {user.gender && (
                <div>
                  <p className="text-sm text-gray-500">
                    Gender
                  </p>
                  <p className="mt-1 font-medium">
                    {GENDER_LABELS[user.gender]}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500">
                  Reviews
                </p>
                <p className="mt-1 font-medium">
                  {user.reviewCount}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">
                  Member since
                </p>
                <p className="mt-1 font-medium">
                  {new Date(
                    user.createdAt,
                  ).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}