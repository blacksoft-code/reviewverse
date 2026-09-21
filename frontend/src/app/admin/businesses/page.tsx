'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { search, SearchEntity } from '@/services/search.service';
import {
  Category,
  getCategories,
} from '@/services/category.service';
import {
  SubCategory,
  getSubCategories,
} from '@/services/subcategory.service';
import { reassignEntityCategory } from '@/services/entity-management.service';

export default function AdminBusinessesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<
    SearchEntity[]
  >([]);
  const [searching, setSearching] = useState(false);

  const [selected, setSelected] =
    useState<SearchEntity | null>(null);

  const [categories, setCategories] = useState<
    Category[]
  >([]);
  const [subCategories, setSubCategories] = useState<
    SubCategory[]
  >([]);

  const [categoryId, setCategoryId] = useState('');
  const [subCategoryId, setSubCategoryId] =
    useState('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

    getCategories()
      .then((res) => setCategories(res.data))
      .catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, router]);

  async function handleSearch() {
    if (!query.trim()) return;

    setSearching(true);
    setError('');

    try {
      const response = await search(query);
      setResults(response.data.entities ?? []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Search failed.',
      );
    } finally {
      setSearching(false);
    }
  }

  async function handleSelect(entity: SearchEntity) {
    setSelected(entity);
    setSuccess('');
    setError('');
    setCategoryId(entity.category?.id ?? '');
    setSubCategoryId('');

    if (entity.category?.id) {
      try {
        const response = await getSubCategories(
          entity.category.id,
        );
        setSubCategories(response.data);
      } catch {
        setSubCategories([]);
      }
    }
  }

  async function handleCategoryChange(
    newCategoryId: string,
  ) {
    setCategoryId(newCategoryId);
    setSubCategoryId('');

    if (!newCategoryId) {
      setSubCategories([]);
      return;
    }

    try {
      const response = await getSubCategories(
        newCategoryId,
      );
      setSubCategories(response.data);
    } catch {
      setSubCategories([]);
    }
  }

  async function handleSave() {
    if (!selected || !categoryId) return;

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await reassignEntityCategory(
        selected.id,
        categoryId,
        subCategoryId || null,
      );
      setSuccess(
        `"${selected.name}" updated successfully.`,
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (authLoading) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-2xl">
        <h1 className="text-3xl font-bold">
          Manage Business Category
        </h1>

        <p className="mt-2 text-gray-600">
          Search a business and reassign its category
          / subcategory — no membership required.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-4 rounded-lg bg-green-50 p-3 text-sm text-green-600">
            {success}
          </p>
        )}

        {/* SEARCH */}
        <div className="mt-6 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) =>
              e.key === 'Enter' && handleSearch()
            }
            placeholder="Search business by name..."
            className="flex-1 rounded-lg border p-2.5 text-sm"
          />
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching}
            className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {searching ? 'Searching...' : 'Search'}
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-3 space-y-2">
            {results.map((entity) => (
              <button
                key={entity.id}
                type="button"
                onClick={() => handleSelect(entity)}
                className={`block w-full rounded-lg border p-3 text-left text-sm hover:bg-gray-50 ${
                  selected?.id === entity.id
                    ? 'border-black bg-gray-50'
                    : ''
                }`}
              >
                <p className="font-medium">
                  {entity.name}
                </p>
                <p className="text-xs text-gray-500">
                  {entity.category?.name} ·{' '}
                  {entity.location}
                </p>
              </button>
            ))}
          </div>
        )}

        {/* REASSIGN FORM */}
        {selected && (
          <div className="mt-6 rounded-xl border bg-white p-5">
            <h2 className="text-lg font-semibold">
              {selected.name}
            </h2>

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="text-xs font-medium text-gray-500">
                  Category
                </label>
                <select
                  value={categoryId}
                  onChange={(e) =>
                    handleCategoryChange(
                      e.target.value,
                    )
                  }
                  className="mt-1 w-full rounded-lg border p-2.5 text-sm"
                >
                  <option value="">
                    Select category
                  </option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500">
                  Subcategory
                </label>
                <select
                  value={subCategoryId}
                  onChange={(e) =>
                    setSubCategoryId(e.target.value)
                  }
                  disabled={!categoryId}
                  className="mt-1 w-full rounded-lg border p-2.5 text-sm disabled:bg-gray-100"
                >
                  <option value="">
                    {subCategories.length === 0
                      ? 'No subcategories'
                      : 'Select subcategory (optional)'}
                  </option>
                  {subCategories.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !categoryId}
              className="mt-4 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}