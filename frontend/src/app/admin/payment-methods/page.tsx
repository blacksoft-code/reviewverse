'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import {
  PaymentMethod,
  createPaymentMethod,
  deletePaymentMethod,
  getPaymentMethods,
  updatePaymentMethod,
} from '@/services/payment-method.service';

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

export default function AdminPaymentMethodsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [paymentMethods, setPaymentMethods] = useState<
    PaymentMethod[]
  >([]);
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

    loadPaymentMethods();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, router]);

  async function loadPaymentMethods() {
    try {
      setLoading(true);
      const response = await getPaymentMethods();
      setPaymentMethods(response.data);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load payment methods.',
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
      await createPaymentMethod(name.trim());
      setName('');
      await loadPaymentMethods();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to create payment method.',
      );
    } finally {
      setCreating(false);
    }
  }

  function startEditing(method: PaymentMethod) {
    setEditingId(method.id);
    setEditName(method.name);
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
      await updatePaymentMethod(id, editName.trim());
      cancelEditing();
      await loadPaymentMethods();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update payment method.',
      );
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete(method: PaymentMethod) {
    if (
      !window.confirm(
        `"${method.name}" মুছে ফেলবে? এটা যেসব business-এ যুক্ত আছে, সেখান থেকেও বাদ পড়ে যাবে।`,
      )
    ) {
      return;
    }

    try {
      setDeletingId(method.id);
      setError('');
      await deletePaymentMethod(method.id);
      await loadPaymentMethods();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete payment method.',
      );
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="mb-6 text-[28px] font-semibold text-[#1d1d1f]">
        Payment Methods
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
          placeholder="যেমন: Cash, Visa, bKash"
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
      ) : paymentMethods.length === 0 ? (
        <p className="text-[#86868b]">
          এখনো কোনো payment method যোগ করা হয়নি।
        </p>
      ) : (
        <ul className="space-y-2">
          {paymentMethods.map((method) => (
            <li
              key={method.id}
              className="flex items-center justify-between rounded-xl border border-[#d2d2d7] bg-white px-4 py-3"
            >
              {editingId === method.id ? (
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
                      savingId === method.id ||
                      !editName.trim()
                    }
                    onClick={() => handleSave(method.id)}
                  >
                    {savingId === method.id
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
                    {method.name}
                  </span>

                  <span className="flex gap-3">
                    <button
                      type="button"
                      className={LINK_ACTION}
                      onClick={() => startEditing(method)}
                    >
                      Rename
                    </button>
                    <button
                      type="button"
                      className={LINK_DANGER}
                      disabled={deletingId === method.id}
                      onClick={() => handleDelete(method)}
                    >
                      {deletingId === method.id
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