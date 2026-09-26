
'use client';

import { FormEvent, useRef, useState } from 'react';

import OfferingTypeInput from './OfferingTypeInput';
import { uploadImage } from '@/services/media.service';
import {
  Offering,
  createOffering,
} from '@/services/offering.service';

type OfferingFormProps = {
  entityId: string;
  onCreated: (offering: Offering) => void;
  wrapperClassName?: string;
  submitButtonClassName?: string;
};

export default function OfferingForm({
  entityId,
  onCreated,
  wrapperClassName,
  submitButtonClassName,
}: OfferingFormProps) {
  const [name, setName] = useState('');
  const [type, setType] = useState('');
  const [price, setPrice] = useState('');
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<File | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const isSubmittingRef = useRef(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    if (isSubmittingRef.current) return;

    isSubmittingRef.current = true;
    setError('');
    setSubmitting(true);

    try {
      const response = await createOffering(entityId, {
        name,
        type,
        price: Number(price),
        description: description || undefined,
      });

      let offering = response.data;

      if (image) {
        const media = await uploadImage(
          image,
          'OFFERING',
          offering.id,
        );

        offering = { ...offering, media: [media] };
      }

      onCreated(offering);

      setName('');
      setType('');
      setPrice('');
      setDescription('');
      setImage(null);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to add offering',
      );
    } finally {
      setSubmitting(false);
      isSubmittingRef.current = false;
    }
  }

  const inputClassName =
    'w-full rounded-xl border border-gray-200 bg-gray-50/70 px-4 py-3 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:bg-white focus:ring-4 focus:ring-gray-100';

  return (
    <form
      onSubmit={handleSubmit}
      className={`w-full max-w-2xl rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm sm:p-8 ${
        wrapperClassName ?? 'mt-6'
      }`}
    >
      {/* Header */}
      <div className="mb-8">
        <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-gray-100 text-gray-800">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>

        <h2 className="text-2xl font-semibold tracking-tight text-gray-950">
          Add an offering
        </h2>

        <p className="mt-2 text-sm leading-6 text-gray-500">
          Add a product or service with its details, pricing,
          and a photo.
        </p>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-6 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600"
        >
          {error}
        </div>
      )}

      <div className="space-y-6">
        {/* Offering name */}
        <div className="space-y-2">
          <label
            htmlFor="offering-name"
            className="block text-sm font-medium text-gray-800"
          >
            Offering name
          </label>

          <input
            id="offering-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Mutton Kacchi Biriyani"
            required
            className={inputClassName}
          />
        </div>

        {/* Offering type */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-800">
            Offering Type
          </label>

          <OfferingTypeInput
            value={type}
            onChange={setType}
            required
          />
        </div>

        {/* Price */}
        <div className="space-y-2">
          <label
            htmlFor="offering-price"
            className="block text-sm font-medium text-gray-800"
          >
            Price
          </label>

          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-4 flex items-center text-sm text-gray-400">
              ৳
            </span>

            <input
              id="offering-price"
              type="number"
              step="0.01"
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              required
              className={`${inputClassName} pl-9`}
            />
          </div>

          <p className="text-xs text-gray-400">
            Enter the price in BDT.
          </p>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <label
            htmlFor="offering-description"
            className="block text-sm font-medium text-gray-800"
          >
            Description
            <span className="ml-2 font-normal text-gray-400">
              Optional
            </span>
          </label>

          <textarea
            id="offering-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell customers a little more about this offering..."
            rows={4}
            className={`${inputClassName} resize-none`}
          />

          <p className="text-right text-xs text-gray-400">
            {description.length} characters
          </p>
        </div>

        {/* Photo */}
        <div className="space-y-2">
          <label
            htmlFor="offering-image"
            className="block text-sm font-medium text-gray-800"
          >
            Offering photo
            <span className="ml-2 font-normal text-gray-400">
              Optional
            </span>
          </label>

          <label
            htmlFor="offering-image"
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50/70 px-5 py-8 text-center transition hover:border-gray-400 hover:bg-gray-50"
          >
            <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-white shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="21"
                height="21"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="3" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>

            <span className="text-sm font-medium text-gray-800">
              {image ? image.name : 'Choose a photo'}
            </span>

            <span className="mt-1 text-xs text-gray-400">
              {image
                ? 'Click to select another photo'
                : 'PNG, JPG or other image formats'}
            </span>
          </label>

          <input
            id="offering-image"
            type="file"
            accept="image/*"
            onChange={(e) =>
              setImage(e.target.files?.[0] ?? null)
            }
            className="sr-only"
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 flex flex-col-reverse gap-3 border-t border-gray-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs leading-5 text-gray-400">
          Add the details customers need to know.
        </p>

        <button
          type="submit"
          disabled={submitting}
          className={`inline-flex items-center justify-center rounded-full bg-black px-6 py-3 text-sm font-medium text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-50 ${
            submitButtonClassName ?? ''
          }`}
        >
          {submitting ? (
            <>
              <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Adding...
            </>
          ) : (
            'Add offering'
          )}
        </button>
      </div>
    </form>
  );
}