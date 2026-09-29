'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import {
  Location,
  createLocation,
  deleteLocation,
  getLocationChildren,
  moveLocation,
  searchLocations,
  updateLocation,
} from '@/services/location.service';

const FIELD =
  'w-full rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] placeholder:text-[#86868b] outline-none transition focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/10 disabled:bg-[#f5f5f7]';
const BTN_PRIMARY =
  'rounded-full bg-[#0071e3] px-4 py-2 text-[14px] font-medium text-white transition hover:bg-[#0077ed] disabled:cursor-not-allowed disabled:bg-[#0071e3]/40';
const BTN_GHOST =
  'rounded-full border border-[#d2d2d7] px-4 py-2 text-[14px] font-medium text-[#1d1d1f] transition hover:bg-[#f5f5f7]';
const LINK_ACTION =
  'text-[13px] font-medium text-[#0071e3] transition hover:text-[#0077ed]';
const LINK_DANGER =
  'text-[13px] font-medium text-[#ff3b30] transition hover:text-[#ff453a] disabled:opacity-40';

type Mode = 'rename' | 'add' | 'move';

export default function AdminLocationsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  // parentId ('root' = country level) -> children
  const [childrenMap, setChildrenMap] = useState<
    Record<string, Location[]>
  >({});
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(),
  );
  const [loadingKey, setLoadingKey] = useState<string | null>(
    null,
  );
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // কোন node-এ কোন action চলছে (একবারে একটাই)
  const [active, setActive] = useState<{
    id: string; // 'root' হলে root-level add
    mode: Mode;
  } | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [inputType, setInputType] = useState('');
  const [busy, setBusy] = useState(false);

  // Move-এর জন্য new parent search
  const [parentQuery, setParentQuery] = useState('');
  const [parentResults, setParentResults] = useState<Location[]>(
    [],
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

    loadChildren('root');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, router]);

  // Move panel-এ টাইপ করলে predictive search
  useEffect(() => {
    if (active?.mode !== 'move' || parentQuery.trim() === '') {
      setParentResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await searchLocations(parentQuery.trim());
        setParentResults(res.data);
      } catch {
        setParentResults([]);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [parentQuery, active]);

  async function loadChildren(key: string) {
    try {
      setLoadingKey(key);
      const res = await getLocationChildren(
        key === 'root' ? undefined : key,
      );
      setChildrenMap((prev) => ({ ...prev, [key]: res.data }));
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load locations.',
      );
    } finally {
      setLoadingKey(null);
    }
  }

  async function toggle(id: string) {
    const next = new Set(expanded);

    if (next.has(id)) {
      next.delete(id);
      setExpanded(next);
      return;
    }

    next.add(id);
    setExpanded(next);

    if (!childrenMap[id]) {
      await loadChildren(id);
    }
  }

  function openAction(id: string, mode: Mode, current?: Location) {
    setActive({ id, mode });
    setInputValue(mode === 'rename' ? (current?.name ?? '') : '');
    setInputType(mode === 'rename' ? (current?.type ?? '') : '');
    setParentQuery('');
    setParentResults([]);
    setNotice('');
    setError('');
  }

  function closeAction() {
    setActive(null);
    setInputValue('');
    setInputType('');
    setParentQuery('');
    setParentResults([]);
  }

  async function handleRename(e: FormEvent, loc: Location) {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      setBusy(true);
      await updateLocation(loc.id, {
        name: inputValue.trim(),
        type: inputType.trim() || undefined,
      });
      await loadChildren(loc.parentId ?? 'root');
      setNotice(`"${inputValue.trim()}" নামে আপডেট হয়েছে।`);
      closeAction();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Rename failed.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleAdd(e: FormEvent, parentId: string) {
    e.preventDefault();
    if (!inputValue.trim()) return;

    try {
      setBusy(true);
      await createLocation({
        name: inputValue.trim(),
        parentId: parentId === 'root' ? undefined : parentId,
        type: inputType.trim() || undefined,
      });
      await loadChildren(parentId);
      if (parentId !== 'root') {
        setExpanded((prev) => new Set(prev).add(parentId));
      }
      setNotice(`"${inputValue.trim()}" যোগ হয়েছে।`);
      closeAction();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Create failed.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleMove(
    loc: Location,
    newParentId: string | null,
  ) {
    try {
      setBusy(true);
      await moveLocation(loc.id, newParentId);

      // পুরনো আর নতুন — দুই parent-এর list-ই নতুন করে আনা
      await loadChildren(loc.parentId ?? 'root');
      await loadChildren(newParentId ?? 'root');
      setNotice(`"${loc.name}" সরানো হয়েছে।`);
      closeAction();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Move failed.',
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(loc: Location) {
    if (!window.confirm(`"${loc.name}" মুছে ফেলবে?`)) return;

    try {
      setBusy(true);
      await deleteLocation(loc.id);
      await loadChildren(loc.parentId ?? 'root');
      setNotice(`"${loc.name}" মুছে গেছে।`);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Delete failed.',
      );
    } finally {
      setBusy(false);
    }
  }

  function renderNode(loc: Location, depth: number) {
    const isOpen = expanded.has(loc.id);
    const isActive = active?.id === loc.id;

    return (
      <li key={loc.id}>
        <div
          className="flex flex-wrap items-center gap-3 rounded-xl px-3 py-2 hover:bg-[#f5f5f7]"
          style={{ marginLeft: depth * 20 }}
        >
          <button
            type="button"
            onClick={() => toggle(loc.id)}
            className="w-5 text-left text-[#86868b]"
            aria-label={isOpen ? 'Collapse' : 'Expand'}
          >
            {isOpen ? '▾' : '▸'}
          </button>

          <span className="text-[15px] font-medium text-[#1d1d1f]">
            {loc.name}
          </span>

          {loc.type && (
            <span className="rounded-full bg-[#f5f5f7] px-2 py-0.5 text-[12px] text-[#86868b]">
              {loc.type}
            </span>
          )}

          <span className="ml-auto flex gap-3">
            <button
              type="button"
              className={LINK_ACTION}
              onClick={() => openAction(loc.id, 'add')}
            >
              + Child
            </button>
            <button
              type="button"
              className={LINK_ACTION}
              onClick={() => openAction(loc.id, 'rename', loc)}
            >
              Rename
            </button>
            <button
              type="button"
              className={LINK_ACTION}
              onClick={() => openAction(loc.id, 'move')}
            >
              Move
            </button>
            <button
              type="button"
              className={LINK_DANGER}
              disabled={busy}
              onClick={() => handleDelete(loc)}
            >
              Delete
            </button>
          </span>
        </div>

        {isActive && active && (
          <div
            className="my-2 rounded-xl border border-[#d2d2d7] bg-white p-4"
            style={{ marginLeft: depth * 20 + 28 }}
          >
            {active.mode === 'rename' && (
              <form
                onSubmit={(e) => handleRename(e, loc)}
                className="space-y-3"
              >
                <input
                  className={FIELD}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="নতুন নাম"
                  autoFocus
                />
                <input
                  className={FIELD}
                  value={inputType}
                  onChange={(e) => setInputType(e.target.value)}
                  placeholder="type (country, city, area… ঐচ্ছিক)"
                />
                <div className="flex gap-2">
                  <button
                    className={BTN_PRIMARY}
                    disabled={busy || !inputValue.trim()}
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    className={BTN_GHOST}
                    onClick={closeAction}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {active.mode === 'add' && (
              <form
                onSubmit={(e) => handleAdd(e, loc.id)}
                className="space-y-3"
              >
                <p className="text-[13px] text-[#86868b]">
                  &quot;{loc.name}&quot;-এর নিচে নতুন location
                </p>
                <input
                  className={FIELD}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Location-এর নাম"
                  autoFocus
                />
                <input
                  className={FIELD}
                  value={inputType}
                  onChange={(e) => setInputType(e.target.value)}
                  placeholder="type (ঐচ্ছিক)"
                />
                <div className="flex gap-2">
                  <button
                    className={BTN_PRIMARY}
                    disabled={busy || !inputValue.trim()}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    className={BTN_GHOST}
                    onClick={closeAction}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {active.mode === 'move' && (
              <div className="space-y-3">
                <p className="text-[13px] text-[#86868b]">
                  &quot;{loc.name}&quot; (আর তার নিচের সব) কোন parent-এর
                  নিচে যাবে? খুঁজে select করো।
                </p>
                <input
                  className={FIELD}
                  value={parentQuery}
                  onChange={(e) => setParentQuery(e.target.value)}
                  placeholder="নতুন parent-এর নাম লেখো…"
                  autoFocus
                />

                {parentResults
                  .filter((r) => r.id !== loc.id)
                  .map((r) => (
                    <button
                      key={r.id}
                      type="button"
                      disabled={busy}
                      onClick={() => handleMove(loc, r.id)}
                      className="block w-full rounded-xl border border-[#d2d2d7] px-3.5 py-2 text-left text-[14px] hover:bg-[#f5f5f7]"
                    >
                      {r.name}
                      {r.parent && (
                        <span className="text-[#86868b]">
                          {' '}
                          — {r.parent.name}
                        </span>
                      )}
                    </button>
                  ))}

                <div className="flex gap-2">
                  <button
                    type="button"
                    className={BTN_GHOST}
                    disabled={busy}
                    onClick={() => handleMove(loc, null)}
                  >
                    Root (country level)-এ আনো
                  </button>
                  <button
                    type="button"
                    className={BTN_GHOST}
                    onClick={closeAction}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {isOpen && (
          <ul>
            {loadingKey === loc.id && (
              <li
                className="px-3 py-1 text-[13px] text-[#86868b]"
                style={{ marginLeft: (depth + 1) * 20 }}
              >
                Loading…
              </li>
            )}
            {childrenMap[loc.id]?.length === 0 &&
              loadingKey !== loc.id && (
                <li
                  className="px-3 py-1 text-[13px] text-[#86868b]"
                  style={{ marginLeft: (depth + 1) * 20 + 28 }}
                >
                  কোনো child নেই
                </li>
              )}
            {childrenMap[loc.id]?.map((child) =>
              renderNode(child, depth + 1),
            )}
          </ul>
        )}
      </li>
    );
  }

  const roots = childrenMap['root'];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-[28px] font-semibold text-[#1d1d1f]">
          Locations
        </h1>
        <button
          type="button"
          className={BTN_PRIMARY}
          onClick={() => openAction('root', 'add')}
        >
          + Root location
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-xl bg-[#ff3b30]/10 px-4 py-3 text-[14px] text-[#ff3b30]">
          {error}
        </p>
      )}
      {notice && (
        <p className="mb-4 rounded-xl bg-[#34c759]/10 px-4 py-3 text-[14px] text-[#248a3d]">
          {notice}
        </p>
      )}

      {active?.id === 'root' && active.mode === 'add' && (
        <form
          onSubmit={(e) => handleAdd(e, 'root')}
          className="mb-4 space-y-3 rounded-xl border border-[#d2d2d7] bg-white p-4"
        >
          <input
            className={FIELD}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Country / root-এর নাম"
            autoFocus
          />
          <input
            className={FIELD}
            value={inputType}
            onChange={(e) => setInputType(e.target.value)}
            placeholder="type (ঐচ্ছিক)"
          />
          <div className="flex gap-2">
            <button
              className={BTN_PRIMARY}
              disabled={busy || !inputValue.trim()}
            >
              Add
            </button>
            <button
              type="button"
              className={BTN_GHOST}
              onClick={closeAction}
            >
              Cancel
            </button>
          </div>
        </form>
      )}

      {loadingKey === 'root' && !roots && (
        <p className="text-[#86868b]">Loading…</p>
      )}

      {roots && roots.length === 0 && (
        <p className="text-[#86868b]">এখনো কোনো location নেই।</p>
      )}

      <ul>{roots?.map((loc) => renderNode(loc, 0))}</ul>
    </main>
  );
}