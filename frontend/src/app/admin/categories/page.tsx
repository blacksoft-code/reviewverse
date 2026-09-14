'use client';

import {
  FormEvent,
  useEffect,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';

import {
  Category,
  createCategory,
  deleteCategory,
  getCategories,
  updateCategory,
} from '@/services/category.service';

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [categories, setCategories] = useState<
    Category[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ───── Create form ─────
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] =
    useState(false);
  const [creating, setCreating] = useState(false);

  // ───── Inline edit ─────
  const [editingId, setEditingId] = useState<
    string | null
  >(null);
  const [editName, setEditName] = useState('');
  const [editSlug, setEditSlug] = useState('');
  const [savingId, setSavingId] = useState<
    string | null
  >(null);

  const [deletingId, setDeletingId] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    if (user.role !== 'ADMIN') {
      router.push('/');
      return;
    }

    loadCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, router]);

  async function loadCategories() {
    try {
      setLoading(true);
      const response = await getCategories();
      setCategories(response.data);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load categories.',
      );
    } finally {
      setLoading(false);
    }
  }

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const response = await createCategory({
        name,
        slug,
      });
      setCategories((prev) => [
        response.data,
        ...prev,
      ]);
      setName('');
      setSlug('');
      setSlugTouched(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create category.',
      );
    } finally {
      setCreating(false);
    }
  }

  function startEditing(category: Category) {
    setEditingId(category.id);
    setEditName(category.name);
    setEditSlug(category.slug);
  }

  function cancelEditing() {
    setEditingId(null);
    setEditName('');
    setEditSlug('');
  }

  async function handleUpdate(id: string) {
    setSavingId(id);
    setError('');

    try {
      const response = await updateCategory(id, {
        name: editName,
        slug: editSlug,
      });

      setCategories((prev) =>
        prev.map((c) =>
          c.id === id ? response.data : c,
        ),
      );
      cancelEditing();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update category.',
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(
    id: string,
    name: string,
  ) {
    const confirmed = window.confirm(
      `Delete category "${name}"? This cannot be undone.`,
    );

    if (!confirmed) return;

    setDeletingId(id);
    setError('');

    try {
      await deleteCategory(id);
      setCategories((prev) =>
        prev.filter((c) => c.id !== id),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete category.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-3xl font-bold">
          Manage Categories
        </h1>

        <p className="mt-2 text-gray-600">
          Create, edit, or delete business
          categories.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* ================================= */}
        {/* CREATE FORM */}
        {/* ================================= */}

        <form
          onSubmit={handleCreate}
          className="mt-6 rounded-xl border bg-black p-5"
        >
          <h2 className="text-lg font-semibold">
            Add new category
          </h2>

          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-xs font-medium text-gray-500">
                Name
              </label>
              <input
                value={name}
                onChange={(e) =>
                  handleNameChange(e.target.value)
                }
                required
                placeholder="Restaurant"
                className="mt-1 w-full rounded-lg border p-2.5 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-500">
                Slug
              </label>
              <input
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
                required
                placeholder="restaurant"
                className="mt-1 w-full rounded-lg border p-2.5 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={creating}
            className="mt-4 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {creating ? 'Adding...' : 'Add category'}
          </button>
        </form>

        {/* ================================= */}
        {/* LIST */}
        {/* ================================= */}

        <div className="mt-8 space-y-3">
          {categories.length === 0 ? (
            <p className="text-sm text-gray-500">
              No categories yet.
            </p>
          ) : (
            categories.map((category) =>
              editingId === category.id ? (
                <div
                  key={category.id}
                  className="rounded-lg border bg-black p-4"
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <input
                      value={editName}
                      onChange={(e) =>
                        setEditName(e.target.value)
                      }
                      className="rounded-lg border p-2.5 text-sm"
                    />
                    <input
                      value={editSlug}
                      onChange={(e) =>
                        setEditSlug(e.target.value)
                      }
                      className="rounded-lg border p-2.5 text-sm"
                    />
                  </div>

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdate(category.id)
                      }
                      disabled={
                        savingId === category.id
                      }
                      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-grey-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={category.id}
                  className="flex items-center justify-between rounded-lg border bg-white p-4"
                >
                  <div>
                    <p className="font-medium">
                      {category.name}
                    </p>
                    <p className="text-xs text-gray-400">
                      /{category.slug}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        startEditing(category)
                      }
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(
                          category.id,
                          category.name,
                        )
                      }
                      disabled={
                        deletingId === category.id
                      }
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {deletingId === category.id
                        ? '...'
                        : 'Delete'}
                    </button>
                  </div>
                </div>
              ),
            )
          )}
        </div>
      </div>
    </main>
  );
}