'use client';

import { useEffect, useState } from 'react';
import {
  BusinessHour,
  BusinessHourInput,
  DAY_LABELS,
  getBusinessHours,
  setBusinessHours,
} from '@/services/business-hour.service';

type DayStatus = 'unset' | 'open' | 'closed';

type DayState = {
  dayOfWeek: number;
  status: DayStatus;
  openTime: string;
  closeTime: string;
};

function buildDays(existing: BusinessHour[]): DayState[] {
  return Array.from({ length: 7 }, (_, dayOfWeek) => {
    const found = existing.find(
      (h) => h.dayOfWeek === dayOfWeek,
    );

    if (!found) {
      return {
        dayOfWeek,
        status: 'unset' as DayStatus,
        openTime: '09:00',
        closeTime: '21:00',
      };
    }

    return {
      dayOfWeek,
      status: (found.isClosed ? 'closed' : 'open') as DayStatus,
      openTime: found.openTime ?? '09:00',
      closeTime: found.closeTime ?? '21:00',
    };
  });
}

export default function BusinessHoursEditor({
  entityId,
}: {
  entityId: string;
}) {
  // "Open day" আর "Close day" — দুইটা বক্সই এই একটা source array
  // (days) থেকেই derive হয়, তাই একই day দুই বক্সে একসাথে thাকতে
  // পারে না — একটায় select করলে আরেকটা থেকে এমনিতেই বাদ পড়ে যায়।
  const [days, setDays] = useState<DayState[]>(
    buildDays([]),
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const response = await getBusinessHours(entityId);
        setDays(buildDays(response.data.hours));
      } catch {
        // load না হলেও ফাঁকা state দিয়ে শুরু করা যাবে
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [entityId]);

  function setStatus(dayOfWeek: number, status: DayStatus) {
    setDays((current) =>
      current.map((d) =>
        d.dayOfWeek === dayOfWeek ? { ...d, status } : d,
      ),
    );
    setSaved(false);
  }

  function updateTime(
    dayOfWeek: number,
    field: 'openTime' | 'closeTime',
    value: string,
  ) {
    setDays((current) =>
      current.map((d) =>
        d.dayOfWeek === dayOfWeek
          ? { ...d, [field]: value }
          : d,
      ),
    );
    setSaved(false);
  }

  async function handleSave() {
    const payload: BusinessHourInput[] = days
      .filter((d) => d.status !== 'unset')
      .map((d) => ({
        dayOfWeek: d.dayOfWeek,
        isClosed: d.status === 'closed',
        ...(d.status === 'open' && {
          openTime: d.openTime,
          closeTime: d.closeTime,
        }),
      }));

    if (payload.length === 0) {
      setError(
        'অন্তত একটা day-কে Open অথবা Closed হিসেবে select করো।',
      );
      return;
    }

    try {
      setSaving(true);
      setError('');
      await setBusinessHours(entityId, payload);
      setSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to save business hours.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <p className="text-sm text-gray-500">
        Loading business hours…
      </p>
    );
  }

  const openDays = days.filter((d) => d.status === 'open');

  return (
    <div className="space-y-4">
      {error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {error}
        </p>
      )}

      {saved && (
        <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
          Business hours saved.
        </p>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {/* Open Days box */}
        <div className="rounded-lg border p-3">
          <h4 className="mb-2 text-sm font-semibold">
            Open Days
          </h4>

          {days.map((d) => (
            <label
              key={`open-${d.dayOfWeek}`}
              className="flex items-center gap-2 py-1 text-sm"
            >
              <input
                type="checkbox"
                checked={d.status === 'open'}
                onChange={() =>
                  setStatus(
                    d.dayOfWeek,
                    d.status === 'open' ? 'unset' : 'open',
                  )
                }
              />
              {DAY_LABELS[d.dayOfWeek]}
            </label>
          ))}
        </div>

        {/* Closed Days box — 'open' হিসেবে marked day এখানে disabled */}
        <div className="rounded-lg border p-3">
          <h4 className="mb-2 text-sm font-semibold">
            Closed Days
          </h4>

          {days.map((d) => (
            <label
              key={`closed-${d.dayOfWeek}`}
              className={`flex items-center gap-2 py-1 text-sm ${
                d.status === 'open'
                  ? 'text-gray-300'
                  : ''
              }`}
            >
              <input
                type="checkbox"
                disabled={d.status === 'open'}
                checked={d.status === 'closed'}
                onChange={() =>
                  setStatus(
                    d.dayOfWeek,
                    d.status === 'closed'
                      ? 'unset'
                      : 'closed',
                  )
                }
              />
              {DAY_LABELS[d.dayOfWeek]}
            </label>
          ))}
        </div>
      </div>

      {openDays.length > 0 && (
        <div className="rounded-lg border p-3">
          <h4 className="mb-3 text-sm font-semibold">
            Hours for open days
          </h4>

          <div className="space-y-3">
            {openDays.map((d) => (
              <div
                key={d.dayOfWeek}
                className="flex flex-wrap items-center gap-3 text-sm"
              >
                <span className="w-24 shrink-0">
                  {DAY_LABELS[d.dayOfWeek]}
                </span>

                <input
                  type="time"
                  value={d.openTime}
                  onChange={(e) =>
                    updateTime(
                      d.dayOfWeek,
                      'openTime',
                      e.target.value,
                    )
                  }
                  className="rounded-lg border p-2"
                />

                <span className="text-gray-400">to</span>

                <input
                  type="time"
                  value={d.closeTime}
                  onChange={(e) =>
                    updateTime(
                      d.dayOfWeek,
                      'closeTime',
                      e.target.value,
                    )
                  }
                  className="rounded-lg border p-2"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save Business Hours'}
      </button>
    </div>
  );
}