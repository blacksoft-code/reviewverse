'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import SingleImageUploader from '@/components/media/SingleImageUploader';
import OfferingTypeInput from '@/components/offerings/OfferingTypeInput';
import OfferingForm from '@/components/offerings/OfferingForm';

import {
  Offering,
  deleteOffering,
  getOfferingsByEntity,
  updateOffering,
} from '@/services/offering.service';

export default function ManageOfferingsPage() {
  const params = useParams();
  const router = useRouter();

  const entityId = params.entityId as string;

  const { user, loading: authLoading } = useAuth();

  const [offerings, setOfferings] = useState<Offering[]>(
    [],
  );

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // edit করার state
  const [editingOfferingId, setEditingOfferingId] =
    useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingType, setEditingType] = useState('');
  const [editingPrice, setEditingPrice] = useState('');
  const [editingDescription, setEditingDescription] =
    useState('');

  const [actingOn, setActingOn] = useState<string | null>(
    null,
  );

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    loadOfferings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, entityId]);

  async function loadOfferings() {
    try {
      setLoading(true);
      const response = await getOfferingsByEntity(
        entityId,
      );
      setOfferings(response.data);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load offerings.',
      );
    } finally {
      setLoading(false);
    }
  }

  function startEditing(offering: Offering) {
    setEditingOfferingId(offering.id);
    setEditingName(offering.name);
    setEditingType(offering.type);
    setEditingPrice(String(offering.price));
    setEditingDescription(offering.description ?? '');
  }

  function cancelEditing() {
    setEditingOfferingId(null);
    setEditingName('');
    setEditingType('');
    setEditingPrice('');
    setEditingDescription('');
  }

  async function handleUpdate(offeringId: string) {
    setActingOn(offeringId);
    setError('');

    try {
      const response = await updateOffering(offeringId, {
        name: editingName,
        type: editingType,
        price: Number(editingPrice),
        description: editingDescription || undefined,
      });

      setOfferings((prev) =>
        prev.map((o) =>
          o.id === offeringId ? response.data : o,
        ),
      );

      cancelEditing();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update offering',
      );
    } finally {
      setActingOn(null);
    }
  }

  async function handleDelete(offeringId: string) {
    setActingOn(offeringId);
    setError('');

    try {
      await deleteOffering(offeringId);
      setOfferings((prev) =>
        prev.filter((o) => o.id !== offeringId),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete offering',
      );
    } finally {
      setActingOn(null);
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
        <Link
          href="/my-businesses"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Back to my businesses
        </Link>

        <h1 className="mt-4 text-2xl font-bold">
          Manage Offerings
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Offerings you add here appear publicly on your
          business page.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* ================================= */}
        {/* CREATE FORM */}
        {/* ================================= */}

        <OfferingForm
          entityId={entityId}
          onCreated={(offering) =>
            setOfferings((prev) => [offering, ...prev])
          }
          wrapperClassName="mt-6 space-y-3 rounded-xl border bg-white p-5"
        />

        {/* ================================= */}
        {/* OFFERINGS LIST */}
        {/* ================================= */}

        <div className="mt-8 space-y-4">
          {offerings.length === 0 ? (
            <p className="text-sm text-gray-500">
              No offerings yet — add your first one above.
            </p>
          ) : (
            offerings.map((offering) =>
              editingOfferingId === offering.id ? (
                <div
                  key={offering.id}
                  className="space-y-3 rounded-xl border bg-white p-5"
                >
                  <SingleImageUploader
                    type="OFFERING"
                    targetId={offering.id}
                    currentUrl={
                      offering.media[0]?.url ?? null
                    }
                    shape="rectangle"
                    onUploaded={(url) =>
                      setOfferings((prev) =>
                        prev.map((o) =>
                          o.id === offering.id
                            ? {
                                ...o,
                                media: [
                                  { id: 'temp', url },
                                ],
                              }
                            : o,
                        ),
                      )
                    }
                  />

                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) =>
                      setEditingName(e.target.value)
                    }
                    className="w-full rounded-lg border p-2.5 text-sm"
                  />

                  <OfferingTypeInput
                    value={editingType}
                    onChange={setEditingType}
                  />

                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editingPrice}
                    onChange={(e) =>
                      setEditingPrice(e.target.value)
                    }
                    className="w-full rounded-lg border p-2.5 text-sm"
                  />

                  <textarea
                    value={editingDescription}
                    onChange={(e) =>
                      setEditingDescription(
                        e.target.value,
                      )
                    }
                    rows={3}
                    className="w-full resize-none rounded-lg border p-3 text-sm"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdate(offering.id)
                      }
                      disabled={
                        actingOn === offering.id
                      }
                      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  key={offering.id}
                  className="rounded-xl border bg-white p-5"
                >
                  <div className="flex items-start gap-4">
                    {offering.media[0]?.url && (
                      <img
                        src={offering.media[0].url}
                        alt={offering.name}
                        className="h-20 w-20 flex-shrink-0 rounded-lg object-cover"
                      />
                    )}

                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold">
                            {offering.name}
                          </h3>
                          <span className="text-xs text-gray-500">
                            {offering.type}
                          </span>
                        </div>

                        <span className="whitespace-nowrap font-semibold">
                          ৳{offering.price}
                        </span>
                      </div>

                      {offering.description && (
                        <p className="mt-3 whitespace-pre-line text-sm text-gray-600">
                          {offering.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        startEditing(offering)
                      }
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDelete(offering.id)
                      }
                      disabled={
                        actingOn === offering.id
                      }
                      className="rounded-lg border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      {actingOn === offering.id
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