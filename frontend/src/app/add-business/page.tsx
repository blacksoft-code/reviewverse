'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import { getCategories } from '@/services/category.service';
import { createEntity } from '@/services/entity.service';

type Category = {
  id: string;
  name: string;
  slug: string;
};

type Flow =
  | 'reviewer'
  | 'owner'
  | 'reviewer-details'
  | null;

export default function AddBusinessPage() {
  const router = useRouter();

  // =========================
  // BASIC BUSINESS INFO
  // =========================

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('');

  // =========================
  // REVIEWER OPTIONAL INFO
  // =========================

  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [description, setDescription] = useState('');

  // =========================
  // CATEGORIES
  // =========================

  const [categories, setCategories] = useState<Category[]>(
    [],
  );

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  // =========================
  // FLOW
  // =========================

  const [flow, setFlow] = useState<Flow>(null);

  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState('');

  // =========================
  // LOAD CATEGORIES
  // =========================

  useEffect(() => {
    async function loadCategories() {
      try {
        const response = await getCategories();

        setCategories(response.data);
      } catch (error) {
        setError(
          error instanceof Error
            ? error.message
            : 'Failed to load categories',
        );
      } finally {
        setLoadingCategories(false);
      }
    }

    loadCategories();
  }, []);

  // =========================
  // STEP 1
  // BASIC INFO SUBMIT
  // =========================

  function handleBasicInfoSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');

    // Basic information complete.
    // এখন Reviewer / Owner selection দেখাব।
    setFlow('reviewer');
  }

  // =========================
  // REVIEWER
  // CREATE BUSINESS
  // =========================

  async function handleReviewerContinue() {
    setError('');
    setSubmitting(true);

    try {
      const slug = name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

      const response = await createEntity({
        name: name.trim(),
        slug,
        categoryId,
        location: location.trim(),

        // Optional fields
        ...(phone.trim() && {
          phone: phone.trim(),
        }),

        ...(website.trim() && {
          website: website.trim(),
        }),

        ...(description.trim() && {
          description: description.trim(),
        }),
      });

      console.log('Business created:', response);

      // Business create হওয়ার পরে
      // entity details page-এ নিয়ে যাব।
      router.push(`/entities/${slug}`);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Failed to create business',
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-2xl">

        {/* ========================= */}
        {/* PAGE HEADER */}
        {/* ========================= */}

        <h1 className="text-3xl font-bold">
          Add a Business
        </h1>

        <p className="mt-2 text-gray-600">
          Add a business to ReviewVerse.
        </p>

        {/* ================================================= */}
        {/* STEP 1 — BASIC BUSINESS INFORMATION */}
        {/* ================================================= */}

        {flow === null && (
          <form
            onSubmit={handleBasicInfoSubmit}
            className="mt-8 space-y-6"
          >

            {/* Business Name */}
            <div>
              <label className="block text-sm font-medium">
                Business Name
              </label>

              <input
                type="text"
                value={name}
                onChange={(event) =>
                  setName(event.target.value)
                }
                required
                placeholder="e.g. Burger King"
                className="mt-1 w-full rounded-lg border p-3"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium">
                Category
              </label>

              <select
                value={categoryId}
                onChange={(event) =>
                  setCategoryId(event.target.value)
                }
                required
                disabled={loadingCategories}
                className="mt-1 w-full rounded-lg border p-3"
              >
                <option value="">
                  {loadingCategories
                    ? 'Loading categories...'
                    : 'Select a category'}
                </option>

                {categories.map((category) => (
                  <option
                    key={category.id}
                    value={category.id}
                  >
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium">
                Location
              </label>

              <input
                type="text"
                value={location}
                onChange={(event) =>
                  setLocation(event.target.value)
                }
                required
                placeholder="e.g. Dhanmondi, Dhaka"
                className="mt-1 w-full rounded-lg border p-3"
              />
            </div>

            {/* Error */}
            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {/* Continue */}
            <button
              type="submit"
              disabled={loadingCategories}
              className="w-full rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Continue
            </button>

          </form>
        )}

        {/* ================================================= */}
        {/* STEP 2 — REVIEWER / OWNER */}
        {/* ================================================= */}

        {(flow === 'reviewer' || flow === 'owner') && (
          <section className="mt-8">

            <div className="mb-6">
              <h2 className="text-2xl font-semibold">
                How are you adding this business?
              </h2>

              <p className="mt-2 text-gray-600">
                Choose the option that best describes
                what you want to do.
              </p>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">

              {/* ========================= */}
              {/* REVIEWER CARD */}
              {/* ========================= */}

              <button
                type="button"
                onClick={() => setFlow('reviewer')}
                className={`rounded-xl border p-6 text-left transition ${
                  flow === 'reviewer'
                    ? 'border-black ring-2 ring-black'
                    : 'hover:border-gray-400'
                }`}
              >
                <h3 className="text-xl font-semibold">
                  Reviewer
                </h3>

                <p className="mt-3 text-sm text-gray-600">
                  Quick — just to leave your review.
                </p>

                <p className="mt-4 text-sm text-gray-500">
                  Add basic business information and
                  continue directly to reviewing.
                </p>
              </button>

              {/* ========================= */}
              {/* OWNER CARD */}
              {/* ========================= */}

              <button
                type="button"
                onClick={() => setFlow('owner')}
                className={`rounded-xl border p-6 text-left transition ${
                  flow === 'owner'
                    ? 'border-black ring-2 ring-black'
                    : 'hover:border-gray-400'
                }`}
              >
                <h3 className="text-xl font-semibold">
                  Owner
                </h3>

                <p className="mt-3 text-sm text-gray-600">
                  Verification required — for business
                  owners.
                </p>

                <p className="mt-4 text-sm text-gray-500">
                  Add detailed business information and
                  verify your ownership.
                </p>
              </button>

            </div>

            {/* Error */}
            {error && (
              <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {/* ========================= */}
            {/* REVIEWER CONTINUE */}
            {/* ========================= */}

            {flow === 'reviewer' && (
              <div className="mt-6">

                <button
                  type="button"
                  onClick={() =>
                    setFlow('reviewer-details')
                  }
                  className="w-full rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
                >
                  Continue as Reviewer
                </button>

              </div>
            )}

            {/* ========================= */}
            {/* OWNER PLACEHOLDER */}
            {/* ========================= */}

            {flow === 'owner' && (
              <div className="mt-6 rounded-lg border p-5">

                <h3 className="font-semibold">
                  Owner flow
                </h3>

                <p className="mt-2 text-sm text-gray-600">
                  Ownership verification and detailed
                  business information will be added
                  here next.
                </p>

                <button
                  type="button"
                  onClick={() =>
                    setFlow('reviewer')
                  }
                  className="mt-4 text-sm underline"
                >
                  Switch to Reviewer
                </button>

              </div>
            )}

            {/* Back */}
            <button
              type="button"
              onClick={() => setFlow(null)}
              className="mt-5 text-sm text-gray-500 hover:text-black"
            >
              ← Back to basic information
            </button>

          </section>
        )}

        {/* ================================================= */}
        {/* STEP 3 — REVIEWER OPTIONAL DETAILS */}
        {/* ================================================= */}

        {flow === 'reviewer-details' && (
          <section className="mt-8">

            <div>
              <h2 className="text-2xl font-semibold">
                Business Details
              </h2>

              <p className="mt-2 text-gray-600">
                These details are optional. Add more
                information to help people learn about
                this business.
              </p>
            </div>

            <div className="mt-8 space-y-6">

              {/* ========================= */}
              {/* PHONE */}
              {/* ========================= */}

              <div>
                <label className="block text-sm font-medium">
                  Phone Number
                </label>

                <input
                  type="tel"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="+8801712345678"
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </div>

              {/* ========================= */}
              {/* WEBSITE */}
              {/* ========================= */}

              <div>
                <label className="block text-sm font-medium">
                  Website
                </label>

                <input
                  type="url"
                  value={website}
                  onChange={(event) =>
                    setWebsite(event.target.value)
                  }
                  placeholder="https://example.com"
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </div>

              {/* ========================= */}
              {/* DESCRIPTION */}
              {/* ========================= */}

              <div>
                <label className="block text-sm font-medium">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Tell people a little about this business..."
                  rows={4}
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </div>

              {/* Error */}
              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              {/* ========================= */}
              {/* CREATE BUSINESS */}
              {/* ========================= */}

              <button
                type="button"
                onClick={handleReviewerContinue}
                disabled={submitting}
                className="w-full rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting
                  ? 'Creating Business...'
                  : 'Create Business & Continue to Review'}
              </button>

              {/* Back */}
              <button
                type="button"
                onClick={() =>
                  setFlow('reviewer')
                }
                className="w-full text-sm text-gray-500 hover:text-black"
              >
                ← Back
              </button>

            </div>

          </section>
        )}

      </div>
    </main>
  );
}