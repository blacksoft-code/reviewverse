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

import {
  SubCategory,
  createSubCategory,
  deleteSubCategory,
  getSubCategories,
  updateSubCategory,
} from '@/services/subcategory.service';

function slugify(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

// Apple-স্টাইলের shared class name-গুলো এক জায়গায়
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

export default function AdminCategoriesPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [categories, setCategories] = useState<
    Category[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ───── Create category form ─────
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] =
    useState(false);
  const [creating, setCreating] = useState(false);

  // ───── Inline edit category ─────
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

  // ───── Subcategory state (per category) ─────
  const [expandedCategoryId, setExpandedCategoryId] =
    useState<string | null>(null);
  const [subCategories, setSubCategories] = useState<
    Record<string, SubCategory[]>
  >({});
  const [loadingSubs, setLoadingSubs] = useState<
    string | null
  >(null);

  const [newSubName, setNewSubName] = useState('');
  const [newSubSlug, setNewSubSlug] = useState('');
  const [newSubSlugTouched, setNewSubSlugTouched] =
    useState(false);
  const [creatingSub, setCreatingSub] = useState(false);

  const [editingSubId, setEditingSubId] = useState<
    string | null
  >(null);
  const [editSubName, setEditSubName] = useState('');
  const [editSubSlug, setEditSubSlug] = useState('');
  const [savingSubId, setSavingSubId] = useState<
    string | null
  >(null);
  const [deletingSubId, setDeletingSubId] = useState<
    string | null
  >(null);

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
    if (!slugTouched) setSlug(slugify(value));
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

  // ───── Subcategory handlers ─────

  async function toggleExpand(categoryId: string) {
    if (expandedCategoryId === categoryId) {
      setExpandedCategoryId(null);
      return;
    }

    setExpandedCategoryId(categoryId);
    setNewSubName('');
    setNewSubSlug('');
    setNewSubSlugTouched(false);

    if (!subCategories[categoryId]) {
      try {
        setLoadingSubs(categoryId);
        const response = await getSubCategories(
          categoryId,
        );
        setSubCategories((prev) => ({
          ...prev,
          [categoryId]: response.data,
        }));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load subcategories.',
        );
      } finally {
        setLoadingSubs(null);
      }
    }
  }

  function handleNewSubNameChange(value: string) {
    setNewSubName(value);
    if (!newSubSlugTouched) {
      setNewSubSlug(slugify(value));
    }
  }

  async function handleCreateSub(
    categoryId: string,
    e: FormEvent,
  ) {
    e.preventDefault();
    setCreatingSub(true);
    setError('');

    try {
      const response = await createSubCategory({
        name: newSubName,
        slug: newSubSlug,
        categoryId,
      });
      setSubCategories((prev) => ({
        ...prev,
        [categoryId]: [
          ...(prev[categoryId] ?? []),
          response.data,
        ],
      }));
      setNewSubName('');
      setNewSubSlug('');
      setNewSubSlugTouched(false);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create subcategory.',
      );
    } finally {
      setCreatingSub(false);
    }
  }

  function startEditingSub(sub: SubCategory) {
    setEditingSubId(sub.id);
    setEditSubName(sub.name);
    setEditSubSlug(sub.slug);
  }

  function cancelEditingSub() {
    setEditingSubId(null);
    setEditSubName('');
    setEditSubSlug('');
  }

  async function handleUpdateSub(
    categoryId: string,
    subId: string,
  ) {
    setSavingSubId(subId);
    setError('');

    try {
      const response = await updateSubCategory(
        subId,
        { name: editSubName, slug: editSubSlug },
      );
      setSubCategories((prev) => ({
        ...prev,
        [categoryId]: (prev[categoryId] ?? []).map(
          (s) => (s.id === subId ? response.data : s),
        ),
      }));
      cancelEditingSub();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update subcategory.',
      );
    } finally {
      setSavingSubId(null);
    }
  }

  async function handleDeleteSub(
    categoryId: string,
    subId: string,
    subName: string,
  ) {
    const confirmed = window.confirm(
      `Delete subcategory "${subName}"?`,
    );
    if (!confirmed) return;

    setDeletingSubId(subId);
    setError('');

    try {
      await deleteSubCategory(subId);
      setSubCategories((prev) => ({
        ...prev,
        [categoryId]: (prev[categoryId] ?? []).filter(
          (s) => s.id !== subId,
        ),
      }));
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete subcategory.',
      );
    } finally {
      setDeletingSubId(null);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#fbfbfd]">
        <p className="text-[15px] text-[#86868b]">
          Loading…
        </p>
      </main>
    );
  }

  return (
    <main
      className="min-h-screen bg-[#fbfbfd] pb-32"
      style={{
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text", "Helvetica Neue", Arial, sans-serif',
      }}
    >
      {/* ───────── Header ───────── */}
      <div className="border-b border-[#d2d2d7]/60 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto max-w-[720px] px-6 py-14">
          <p className="text-[13px] font-medium tracking-wide text-[#86868b]">
            Admin
          </p>
          <h1 className="mt-1 text-[40px] font-semibold leading-tight tracking-tight text-[#1d1d1f]">
            Categories
          </h1>
          <p className="mt-2 max-w-[480px] text-[17px] leading-relaxed text-[#86868b]">
            Organize every business into a category
            and, where useful, a more specific
            subcategory.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-[720px] px-6">
        {error && (
          <p className="mt-8 rounded-xl bg-[#ff3b30]/8 px-4 py-3 text-[14px] text-[#ff3b30]">
            {error}
          </p>
        )}

        {/* ───────── Add category ───────── */}
        <section className="mt-10 rounded-2xl border border-[#d2d2d7]/70 bg-white p-6">
          <h2 className="text-[17px] font-semibold text-[#1d1d1f]">
            Add a category
          </h2>

          <form
            onSubmit={handleCreate}
            className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label className="text-[13px] text-[#86868b]">
                Name
              </label>
              <input
                value={name}
                onChange={(e) =>
                  handleNameChange(e.target.value)
                }
                required
                placeholder="Restaurant"
                className={`mt-1.5 ${FIELD}`}
              />
            </div>

            <div className="flex-1">
              <label className="text-[13px] text-[#86868b]">
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
                className={`mt-1.5 ${FIELD}`}
              />
            </div>

            <button
              type="submit"
              disabled={creating}
              className={BTN_PRIMARY}
            >
              {creating ? 'Adding…' : 'Add'}
            </button>
          </form>
        </section>

        {/* ───────── List ───────── */}
        <section className="mt-10">
          <h2 className="px-1 text-[13px] font-medium uppercase tracking-wide text-[#86868b]">
            All categories · {categories.length}
          </h2>

          {categories.length === 0 ? (
            <p className="mt-4 rounded-2xl border border-dashed border-[#d2d2d7] px-6 py-10 text-center text-[15px] text-[#86868b]">
              No categories yet.
            </p>
          ) : (
            <div className="mt-4 divide-y divide-[#d2d2d7]/60 overflow-hidden rounded-2xl border border-[#d2d2d7]/70 bg-white">
              {categories.map((category) => {
                const isExpanded =
                  expandedCategoryId === category.id;

                return (
                  <div key={category.id}>
                    {editingId === category.id ? (
                      <div className="p-5">
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          <input
                            value={editName}
                            onChange={(e) =>
                              setEditName(
                                e.target.value,
                              )
                            }
                            className={FIELD}
                          />
                          <input
                            value={editSlug}
                            onChange={(e) =>
                              setEditSlug(
                                e.target.value,
                              )
                            }
                            className={FIELD}
                          />
                        </div>

                        <div className="mt-4 flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpdate(
                                category.id,
                              )
                            }
                            disabled={
                              savingId === category.id
                            }
                            className={BTN_PRIMARY}
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={cancelEditing}
                            className={BTN_GHOST}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-3 px-5 py-4 transition hover:bg-[#f5f5f7]/60">
                        <button
                          type="button"
                          onClick={() =>
                            toggleExpand(category.id)
                          }
                          className="flex flex-1 items-center gap-3 text-left"
                        >
                          <span
                            className={`flex h-5 w-5 shrink-0 items-center justify-center text-[#86868b] transition-transform duration-200 ${
                              isExpanded
                                ? 'rotate-90'
                                : ''
                            }`}
                          >
                            ›
                          </span>

                          <span>
                            <span className="block text-[16px] font-medium text-[#1d1d1f]">
                              {category.name}
                            </span>
                            <span className="block text-[13px] text-[#86868b]">
                              /{category.slug}
                            </span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            startEditing(category)
                          }
                          className={LINK_ACTION}
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
                          className={LINK_DANGER}
                        >
                          {deletingId === category.id
                            ? '…'
                            : 'Delete'}
                        </button>
                      </div>
                    )}

                    {/* ───── Subcategories ───── */}
                    {isExpanded && (
                      <div className="border-t border-[#d2d2d7]/60 bg-[#f5f5f7]/50 px-5 py-5">
                        <p className="text-[12px] font-medium uppercase tracking-wide text-[#86868b]">
                          Subcategories
                        </p>

                        {loadingSubs === category.id ? (
                          <p className="mt-3 text-[14px] text-[#86868b]">
                            Loading…
                          </p>
                        ) : (
                          <div className="mt-3 space-y-2">
                            {(
                              subCategories[
                                category.id
                              ] ?? []
                            ).length === 0 && (
                              <p className="text-[14px] text-[#86868b]">
                                None yet — add the
                                first one below.
                              </p>
                            )}

                            {(
                              subCategories[
                                category.id
                              ] ?? []
                            ).map((sub) =>
                              editingSubId ===
                              sub.id ? (
                                <div
                                  key={sub.id}
                                  className="rounded-xl border border-[#d2d2d7] bg-white p-3"
                                >
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      value={
                                        editSubName
                                      }
                                      onChange={(e) =>
                                        setEditSubName(
                                          e.target
                                            .value,
                                        )
                                      }
                                      className={`${FIELD} py-2 text-[14px]`}
                                    />
                                    <input
                                      value={
                                        editSubSlug
                                      }
                                      onChange={(e) =>
                                        setEditSubSlug(
                                          e.target
                                            .value,
                                        )
                                      }
                                      className={`${FIELD} py-2 text-[14px]`}
                                    />
                                  </div>
                                  <div className="mt-3 flex gap-2">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleUpdateSub(
                                          category.id,
                                          sub.id,
                                        )
                                      }
                                      disabled={
                                        savingSubId ===
                                        sub.id
                                      }
                                      className={`${BTN_PRIMARY} px-4 py-1.5 text-[13px]`}
                                    >
                                      Save
                                    </button>
                                    <button
                                      type="button"
                                      onClick={
                                        cancelEditingSub
                                      }
                                      className={`${BTN_GHOST} px-4 py-1.5 text-[13px]`}
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <div
                                  key={sub.id}
                                  className="flex items-center justify-between rounded-xl border border-[#d2d2d7]/70 bg-white px-4 py-2.5"
                                >
                                  <div>
                                    <p className="text-[14px] text-[#1d1d1f]">
                                      {sub.name}
                                    </p>
                                    <p className="text-[12px] text-[#86868b]">
                                      /{sub.slug}
                                    </p>
                                  </div>
                                  <div className="flex gap-4">
                                    <button
                                      type="button"
                                      onClick={() =>
                                        startEditingSub(
                                          sub,
                                        )
                                      }
                                      className={
                                        LINK_ACTION
                                      }
                                    >
                                      Edit
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        handleDeleteSub(
                                          category.id,
                                          sub.id,
                                          sub.name,
                                        )
                                      }
                                      disabled={
                                        deletingSubId ===
                                        sub.id
                                      }
                                      className={
                                        LINK_DANGER
                                      }
                                    >
                                      {deletingSubId ===
                                      sub.id
                                        ? '…'
                                        : 'Delete'}
                                    </button>
                                  </div>
                                </div>
                              ),
                            )}
                          </div>
                        )}

                        {/* Add subcategory */}
                        <form
                          onSubmit={(e) =>
                            handleCreateSub(
                              category.id,
                              e,
                            )
                          }
                          className="mt-4 flex flex-col gap-2 sm:flex-row"
                        >
                          <input
                            value={newSubName}
                            onChange={(e) =>
                              handleNewSubNameChange(
                                e.target.value,
                              )
                            }
                            placeholder="Subcategory name"
                            required
                            className={`${FIELD} flex-1 py-2 text-[14px]`}
                          />
                          <input
                            value={newSubSlug}
                            onChange={(e) => {
                              setNewSubSlug(
                                e.target.value,
                              );
                              setNewSubSlugTouched(
                                true,
                              );
                            }}
                            placeholder="slug"
                            required
                            className={`${FIELD} w-full py-2 text-[14px] sm:w-32`}
                          />
                          <button
                            type="submit"
                            disabled={creatingSub}
                            className={`${BTN_PRIMARY} py-2 text-[13px]`}
                          >
                            Add
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}