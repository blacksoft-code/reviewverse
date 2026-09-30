'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import {
  Amenity,
  createAmenity,
  deleteAmenity,
  getAmenities,
  updateAmenity,
} from '@/services/amenity.service';

const FIELD =
  'w-full rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] outline-none transition focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 disabled:bg-[#f5f5f7] disabled:text-[#86868b]';

const BTN_PRIMARY =
  'rounded-full bg-[#0071e3] px-5 py-2.5 text-[14px] font-medium text-white transition hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:bg-[#0071e3]/40';

const BTN_GHOST =
  'rounded-full border border-[#d2d2d7] px-5 py-2.5 text-[14px] font-medium text-[#1d1d1f] transition hover:bg-[#f5f5f7]';

const LINK_ACTION =
  'text-[13px] font-medium text-[#0071e3] transition hover:text-[#0077ed]';

const LINK_DANGER =
  'text-[13px] font-medium text-[#ff3b30] transition hover:text-[#ff453a] disabled:opacity-40';

export default function AdminAmenitiesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [amenities, setAmenities] = useState<Amenity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ───── Create form ─────
  const [name, setName] = useState('');
  const [creating, setCreating] = useState(false);

  // ───── Inline edit ─────
  const [editingId, setEditingId] = useState<string | null>(
    null,
  );
  const [editName, setEditName] = useState('');
  const [savingId, setSavingId] = useState<string | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    loadAmenities();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, router]);

  async function loadAmenities() {
    try {
      setLoading(true);
      const response = await getAmenities();
      setAmenities(response.data);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load amenities.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setCreating(true);
      setError('');
      await createAmenity(name.trim());
      setName('');
      await loadAmenities();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create amenity.',
      );
    } finally {
      setCreating(false);
    }
  }

  function startEditing(amenity: Amenity) {
    setEditingId(amenity.id);
    setEditName(amenity.name);
    setError('');
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName('');
  }

  async function handleSave(id: string) {
    if (!editName.trim()) return;

    try {
      setSavingId(id);
      setError('');
      await updateAmenity(id, editName.trim());
      cancelEditing();
      await loadAmenities();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update amenity.',
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(amenity: Amenity) {
    if (
      !window.confirm(
        `"${amenity.name}" মুছে ফেলবে? এটা যেসব business-এ যুক্ত আছে, সেখান থেকেও বাদ পড়ে যাবে।`,
      )
    ) {
      return;
    }

    try {
      setDeletingId(amenity.id);
      setError('');
      await deleteAmenity(amenity.id);
      await loadAmenities();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete amenity.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-[28px] font-semibold text-[#1d1d1f]">
        Amenities
      </h1>

      {error && (
        <p className="mb-4 rounded-xl bg-[#ff3b30]/10 px-4 py-3 text-[14px] text-[#ff3b30]">
          {error}
        </p>
      )}

      <form
        onSubmit={handleCreate}
        className="mb-8 flex gap-2 rounded-xl border border-[#d2d2d7] bg-white p-4"
      >
        <input
          className={FIELD}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="যেমন: Free WiFi, Parking"
        />
        <button
          className={BTN_PRIMARY}
          disabled={creating || !name.trim()}
        >
          {creating ? 'Adding...' : 'Add'}
        </button>
      </form>

      {loading ? (
        <p className="text-[#86868b]">Loading…</p>
      ) : amenities.length === 0 ? (
        <p className="text-[#86868b]">
          এখনো কোনো amenity যোগ করা হয়নি।
        </p>
      ) : (
        <ul className="space-y-2">
          {amenities.map((amenity) => (
            <li
              key={amenity.id}
              className="flex items-center justify-between rounded-xl border border-[#d2d2d7] bg-white px-4 py-3"
            >
              {editingId === amenity.id ? (
                <div className="flex flex-1 items-center gap-2">
                  <input
                    className={FIELD}
                    value={editName}
                    onChange={(e) =>
                      setEditName(e.target.value)
                    }
                    autoFocus
                  />
                  <button
                    type="button"
                    className={BTN_PRIMARY}
                    disabled={
                      savingId === amenity.id ||
                      !editName.trim()
                    }
                    onClick={() => handleSave(amenity.id)}
                  >
                    {savingId === amenity.id
                      ? 'Saving...'
                      : 'Save'}
                  </button>
                  <button
                    type="button"
                    className={BTN_GHOST}
                    onClick={cancelEditing}
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <>
                  <span className="text-[15px] text-[#1d1d1f]">
                    {amenity.name}
                  </span>

                  <span className="flex gap-3">
                    <button
                      type="button"
                      className={LINK_ACTION}
                      onClick={() => startEditing(amenity)}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className={LINK_DANGER}
                      disabled={deletingId === amenity.id}
                      onClick={() => handleDelete(amenity)}
                    >
                      {deletingId === amenity.id
                        ? 'Deleting...'
                        : 'Delete'}
                    </button>
                  </span>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}