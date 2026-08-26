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
  | null
  | 'reviewer'
  | 'owner'
  | 'reviewer-details'
  | 'owner-details';

export default function AddBusinessPage() {
  const router = useRouter();

  // =========================
  // Basic Information
  // =========================

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [location, setLocation] = useState('');

  // =========================
  // Reviewer / Common Details
  // =========================

  const [phone, setPhone] = useState('');
  const [website, setWebsite] = useState('');
  const [email, setEmail] = useState('');
  const [description, setDescription] = useState('');

  // =========================
  // Owner Business Details
  // =========================

  const [businessHours, setBusinessHours] =
    useState('');

  const [priceRange, setPriceRange] =
    useState('');

  const [serviceOptions, setServiceOptions] =
    useState('');

  const [coverPhoto, setCoverPhoto] =
    useState('');

  const [logo, setLogo] =
    useState('');

  const [amenities, setAmenities] =
    useState('');

  const [paymentMethods, setPaymentMethods] =
    useState('');

  const [socialLinks, setSocialLinks] =
    useState('');

  const [menu, setMenu] =
    useState('');

  // =========================
  // Owner Information
  // =========================

  const [ownerName, setOwnerName] =
    useState('');

  const [ownerContact, setOwnerContact] =
    useState('');

  const [businessDocument, setBusinessDocument] =
    useState('');

  const [businessRelationship, setBusinessRelationship] =
    useState('OWNER');

  // =========================
  // Categories
  // =========================

  const [categories, setCategories] =
    useState<Category[]>([]);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  // =========================
  // Flow / UI states
  // =========================

  const [flow, setFlow] = useState<Flow>(null);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] = useState('');

  // =========================
  // Load Categories
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
  // Slug Generator
  // =========================

  function generateSlug(value: string) {
    return value
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  // =========================
  // Step 1
  // Basic Information
  // =========================

  function handleBasicInfoSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');

    setFlow('reviewer');
  }

  // =========================
  // Reviewer Flow
  // =========================

  async function handleReviewerCreate() {
    setError('');
    setSubmitting(true);

    try {
      const slug = generateSlug(name);

      const response = await createEntity({
        name: name.trim(),
        slug,
        categoryId,
        location: location.trim(),

        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        email: email.trim() || undefined,
        description:
          description.trim() || undefined,
      });

      console.log(
        'Reviewer business created:',
        response,
      );

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

  // =========================
  // Owner Flow
  // =========================

  async function handleOwnerCreate() {
    setError('');
    setSubmitting(true);

    try {
      const slug = generateSlug(name);

      const response = await createEntity({
        name: name.trim(),
        slug,
        categoryId,
        location: location.trim(),

        // Common information
        phone: phone.trim() || undefined,
        website: website.trim() || undefined,
        email: email.trim() || undefined,
        description:
          description.trim() || undefined,

        // Business details
        businessHours:
          businessHours.trim() || undefined,

        priceRange:
          priceRange.trim() || undefined,

        serviceOptions:
          serviceOptions.trim() || undefined,

        // Visual
        coverPhoto:
          coverPhoto.trim() || undefined,

        logo:
          logo.trim() || undefined,

        // Additional
        amenities:
          amenities.trim() || undefined,

        paymentMethods:
          paymentMethods.trim() || undefined,

        socialLinks:
          socialLinks.trim() || undefined,

        menu:
          menu.trim() || undefined,

        // Owner information
        ownerName:
          ownerName.trim() || undefined,

        ownerContact:
          ownerContact.trim() || undefined,

        businessDocument:
          businessDocument.trim() || undefined,

        businessRelationship:
          businessRelationship || undefined,
      });

      console.log(
        'Owner business created:',
        response,
      );

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

  // =========================
  // UI
  // =========================

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto max-w-3xl">

        <h1 className="text-3xl font-bold">
          Add a Business
        </h1>

        <p className="mt-2 text-gray-600">
          Add a business to ReviewVerse.
        </p>

        {/* ================================= */}
        {/* STEP 1 — BASIC INFORMATION */}
        {/* ================================= */}

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

            {error && (
              <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loadingCategories}
              className="w-full rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              Continue
            </button>
          </form>
        )}

        {/* ================================= */}
        {/* STEP 2 — FLOW SELECTION */}
        {/* ================================= */}

        {(flow === 'reviewer' ||
          flow === 'owner') && (
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

              {/* Reviewer */}

              <button
                type="button"
                onClick={() =>
                  setFlow('reviewer')
                }
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
                  Add basic information and optional
                  details before leaving a review.
                </p>
              </button>

              {/* Owner */}

              <button
                type="button"
                onClick={() =>
                  setFlow('owner')
                }
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
                  ownership details.
                </p>
              </button>
            </div>

            {error && (
              <p className="mt-5 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {/* Reviewer Continue */}

            {flow === 'reviewer' && (
              <button
                type="button"
                onClick={() =>
                  setFlow('reviewer-details')
                }
                className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
              >
                Continue as Reviewer
              </button>
            )}

            {/* Owner Continue */}

            {flow === 'owner' && (
              <button
                type="button"
                onClick={() =>
                  setFlow('owner-details')
                }
                className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800"
              >
                Continue as Owner
              </button>
            )}

            <button
              type="button"
              onClick={() => setFlow(null)}
              className="mt-5 text-sm text-gray-500 hover:text-black"
            >
              ← Back to basic information
            </button>
          </section>
        )}

        {/* ================================= */}
        {/* REVIEWER DETAILS */}
        {/* ================================= */}

        {flow === 'reviewer-details' && (
          <section className="mt-8">

            <h2 className="text-2xl font-semibold">
              Business Details
            </h2>

            <p className="mt-2 text-gray-600">
              These details are optional.
            </p>

            <div className="mt-6 space-y-5">

              {/* Phone */}

              <div>
                <label className="block text-sm font-medium">
                  Phone Number
                </label>

                <input
                  type="text"
                  value={phone}
                  onChange={(event) =>
                    setPhone(event.target.value)
                  }
                  placeholder="+8801712345678"
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </div>

              {/* Website */}

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

              {/* Email */}

              <div>
                <label className="block text-sm font-medium">
                  Email
                </label>

                <input
                  type="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  placeholder="contact@example.com"
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </div>

              {/* Description */}

              <div>
                <label className="block text-sm font-medium">
                  Description
                </label>

                <textarea
                  value={description}
                  onChange={(event) =>
                    setDescription(event.target.value)
                  }
                  placeholder="Tell people something about this business..."
                  rows={4}
                  className="mt-1 w-full rounded-lg border p-3"
                />
              </div>

              {error && (
                <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <button
                type="button"
                onClick={handleReviewerCreate}
                disabled={submitting}
                className="w-full rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting
                  ? 'Creating Business...'
                  : 'Create Business & Continue to Review'}
              </button>

              <button
                type="button"
                onClick={() =>
                  setFlow('reviewer')
                }
                className="text-sm text-gray-500 hover:text-black"
              >
                ← Back
              </button>
            </div>
          </section>
        )}

        {/* ================================= */}
        {/* OWNER DETAILS */}
        {/* ================================= */}

        {flow === 'owner-details' && (
          <section className="mt-8">

            <div>
              <h2 className="text-2xl font-semibold">
                Owner Business Details
              </h2>

              <p className="mt-2 text-gray-600">
                Add detailed information about your
                business.
              </p>
            </div>

            {/* ================================= */}
            {/* COMMON BUSINESS INFORMATION */}
            {/* ================================= */}

            <div className="mt-8 rounded-xl border p-6">

              <h3 className="text-xl font-semibold">
                Business Information
              </h3>

              <div className="mt-5 space-y-5">

                {/* Phone */}

                <div>
                  <label className="block text-sm font-medium">
                    Phone Number
                  </label>

                  <input
                    type="text"
                    value={phone}
                    onChange={(event) =>
                      setPhone(event.target.value)
                    }
                    placeholder="+8801712345678"
                    className="mt-1 w-full rounded-lg border p-3"
                  />
                </div>

                {/* Website */}

                <div>
                  <label className="block text-sm font-medium">
                    Website URL
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

                {/* Email */}

                <div>
                  <label className="block text-sm font-medium">
                    Email Address
                  </label>

                  <input
                    type="email"
                    value={email}
                    onChange={(event) =>
                      setEmail(event.target.value)
                    }
                    placeholder="contact@example.com"
                    className="mt-1 w-full rounded-lg border p-3"
                  />
                </div>

                {/* Description */}

                <div>
                  <label className="block text-sm font-medium">
                    Business Description
                  </label>

                  <textarea
                    value={description}
                    onChange={(event) =>
                      setDescription(event.target.value)
                    }
                    rows={4}
                    placeholder="Tell customers about your business..."
                    className="mt-1 w-full rounded-lg border p-3"
                  />
                </div>
              </div>
            </div>

            {/* ================================= */}
            {/* OPERATIONAL INFORMATION */}
            {/* ================================= */}

            <div className="mt-6 rounded-xl border p-6">

              <h3 className="text-xl font-semibold">
                Operational Information
              </h3>

              <div className="mt-5 space-y-5">

                {/* Business Hours */}

                <div>
                  <label className="block text-sm font-medium">
                    Business Hours
                  </label>

                  <textarea
                    value={businessHours}
                    onChange={(event) =>
                      setBusinessHours(
                        event.target.value,
                      )
                    }
                    rows={3}
                    placeholder="Mon-Fri: 10:00 AM - 10:00 PM&#10;Sat-Sun: 11:00 AM - 11:00 PM"
                    className="mt-1 w-full rounded-lg border p-3"
                  />
                </div>

                {/* Price Range */}

                <div>
                  <label className="block text-sm font-medium">
                    Price Range
                  </label>

                  <select
                    value={priceRange}
                    onChange={(event) =>
                      setPriceRange(event.target.value)
                    }
                    className="mt-1 w-full rounded-lg border p-3"
                  >
                    <option value="">
                      Select price range
                    </option>

                    <option value="$">
                      $ — Budget
                    </option>

                    <option value="$$">
                      $$ — Moderate
                    </option>

                    <option value="$$$">
                      $$$ — Expensive
                    </option>

                    <option value="$$$$">
                      $$$$ — Premium
                    </option>
                  </select>
                </div>

                {/* Service Options */}

                <div>
                  <label className="block text-sm font-medium">
                    Service Options
                  </label>

                  <input
                    type="text"
                    value={serviceOptions}
                    onChange={(event) =>
                      setServiceOptions(
                        event.target.value,
                      )
                    }
                    placeholder="Dine-in, Takeaway, Delivery"
                    className="mt-1 w-full rounded-lg border p-3"
                  />
                </div>

                {/* Amenities */}

                <div>
                  <label className="block text-sm font-medium">
                    Amenities
                  </label>

                  <input
                    type="text"
                    value={amenities}
                    onChange={(event) =>
                      setAmenities(
                        event.target.value,
                      )
                    }
                    placeholder="WiFi, Parking, Wheelchair Accessible"
                    className="mt-1 w-full rounded-lg border p-3"
                  />
                </div>

                {/* Payment Methods */}

                <div>
                  <label className="block text-sm font-medium">
                    Payment Methods
                  </label>

                  <input
                    type="text"
                    value={paymentMethods}
                    onChange={(event) =>
                      setPaymentMethods(
                        event.target.value,
                      )
                    }
                    placeholder="Cash, Visa, Mastercard, bKash"
                    className="mt-1 w-full rounded-lg border p-3"
                  />
                </div>
              </div>
            </div>

            {/* ================================= */}
            {/* VISUAL CONTENT */}
            {/* ================================= */}

            <div className="mt-6 rounded-xl border p-6">

              <h3 className="text-xl font-semibold">
                Visual Content
              </h3>

              <div className="mt-5 space-y-5">

                {/* Cover */}

                <div>
                  <label className="block text-sm font-medium">
                    Cover Photo URL
                  </label>

                  <input
                    type="url"
                    value={coverPhoto}
                    onChange={(event) =>
                      setCoverPhoto(
                        event.target.value,
                      )
                    }
                    placeholder="https://example.com/cover.jpg"
                    className="mt-1 w-full rounded-lg border p-3"
                  />
                </div>

                {/* Logo */}

                <div>
                  <label className="block text-sm font-medium">
                    Business Logo URL
                  </label>

                  <input
                    type="url"
                    value={logo}
                    onChange={(event) =>
                      setLogo(event.target.value)
                    }
                    placeholder="https://example.com/logo.jpg"
                    className="mt-1 w-full rounded-lg border p-3"
                  />
                </div>
              </div>
            </div>

            {/* ================================= */}
            {/* SOCIAL / ADDITIONAL */}
            {/* ================================= */}

            <div className="mt-6 rounded-xl border p-6">

              <h3 className="text-xl font-semibold">
                Social & Additional Information
              </h3>

              <div className="mt-5 space-y-5">

                {/* Social */}

                <div>
                  <label className="block text-sm font-medium">
                    Social Media Links
                  </label>

                  <textarea
                    value={socialLinks}
                    onChange={(event) =>
                      setSocialLinks(
                        event.target.value,
                      )
                    }
                    rows={3}
                    placeholder="Facebook, Instagram, TikTok..."
                    className="mt-1 w-full rounded-lg border p-3"
                  />
                </div>

                {/* Menu */}

                <div>
                  <label className="block text-sm font-medium">
                    Menu URL
                  </label>

                  <input
                    type="url"
                    value={menu}
                    onChange={(event) =>
                      setMenu(event.target.value)
                    }
                    placeholder="https://example.com/menu"
                    className="mt-1 w-full rounded-lg border p-3"
                  />
                </div>
              </div>
            </div>

            {/* ================================= */}
            {/* OWNER INFORMATION */}
            {/* ================================= */}

            <div className="mt-6 rounded-xl border p-6">

              <h3 className="text-xl font-semibold">
                Owner Information
              </h3>

              <p className="mt-2 text-sm text-gray-500">
                This information will be used later for
                ownership verification.
              </p>

              <div className="mt-5 space-y-5">

                {/* Owner Name */}

                <div>
                  <label className="block text-sm font-medium">
                    Owner / Manager Name
                  </label>

                  <input
                    type="text"
                    value={ownerName}
                    onChange={(event) =>
                      setOwnerName(
                        event.target.value,
                      )
                    }
                    placeholder="John Doe"
                    className="mt-1 w-full rounded-lg border p-3"
                  />
                </div>

                {/* Owner Contact */}

                <div>
                  <label className="block text-sm font-medium">
                    Owner Contact Number / Email
                  </label>

                  <input
                    type="text"
                    value={ownerContact}
                    onChange={(event) =>
                      setOwnerContact(
                        event.target.value,
                      )
                    }
                    placeholder="+8801812345678"
                    className="mt-1 w-full rounded-lg border p-3"
                  />
                </div>

                {/* Business Document */}

                <div>
                  <label className="block text-sm font-medium">
                    Business Document
                  </label>

                  <input
                    type="text"
                    value={businessDocument}
                    onChange={(event) =>
                      setBusinessDocument(
                        event.target.value,
                      )
                    }
                    placeholder="Business registration document reference"
                    className="mt-1 w-full rounded-lg border p-3"
                  />

                  <p className="mt-1 text-xs text-gray-500">
                    File upload will be connected later.
                  </p>
                </div>

                {/* Relationship */}

                <div>
                  <label className="block text-sm font-medium">
                    Relationship to Business
                  </label>

                  <select
                    value={businessRelationship}
                    onChange={(event) =>
                      setBusinessRelationship(
                        event.target.value,
                      )
                    }
                    className="mt-1 w-full rounded-lg border p-3"
                  >
                    <option value="OWNER">
                      Owner
                    </option>

                    <option value="MANAGER">
                      Manager
                    </option>

                    <option value="EMPLOYEE">
                      Employee
                    </option>
                  </select>
                </div>
              </div>
            </div>

            {/* ================================= */}
            {/* ERROR */}
            {/* ================================= */}

            {error && (
              <p className="mt-6 rounded-lg bg-red-50 p-3 text-sm text-red-600">
                {error}
              </p>
            )}

            {/* ================================= */}
            {/* CREATE */}
            {/* ================================= */}

            <button
              type="button"
              onClick={handleOwnerCreate}
              disabled={submitting}
              className="mt-6 w-full rounded-lg bg-black px-5 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {submitting
                ? 'Creating Business...'
                : 'Create Business'}
            </button>

            <button
              type="button"
              onClick={() =>
                setFlow('owner')
              }
              className="mt-4 text-sm text-gray-500 hover:text-black"
            >
              ← Back to Owner Selection
            </button>
          </section>
        )}
      </div>
    </main>
  );
}