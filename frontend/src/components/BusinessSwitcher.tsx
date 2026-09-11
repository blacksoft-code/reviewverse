'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { useBusinessContext } from '@/context/BusinessContext';

import {
  EntityMembership,
  getMyMemberships,
} from '@/services/entity-membership.service';

export default function BusinessSwitcher() {
  const { user } = useAuth();
  const router = useRouter();

  const { activeBusiness, setActiveBusiness } =
    useBusinessContext();

  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [memberships, setMemberships] = useState<
    EntityMembership[]
  >([]);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          e.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    );

    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      );
  }, []);

  async function handleToggle() {
    const next = !open;
    setOpen(next);

    if (next && !loaded) {
      try {
        const response = await getMyMemberships();
        setMemberships(response.data);
      } catch {
        // ব্যর্থ হলেও dropdown শুধু empty state দেখাবে
      } finally {
        setLoaded(true);
      }
    }
  }

  function handleSwitchToPersonal() {
    setActiveBusiness(null);
    setOpen(false);
    router.push('/');
  }

  if (!user) {
    return null;
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2 text-sm text-gray-300 hover:text-white"
      >
        {activeBusiness ? (
          <>
            <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-gray-700 text-xs">
              {activeBusiness.logo ? (
                <img
                  src={activeBusiness.logo}
                  alt={activeBusiness.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                activeBusiness.name
                  .charAt(0)
                  .toUpperCase()
              )}
            </span>
            {activeBusiness.name} ▾
          </>
        ) : (
          <>Hey, {user.name} ▾</>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 rounded-lg border bg-white p-2 text-black shadow-lg">
          {/* ───────── এখন কোন business হিসেবে আছো, সেটা ───────── */}
          {activeBusiness && (
            <>
              <div className="px-3 py-2">
                <p className="text-xs text-gray-400">
                  You&apos;re managing
                </p>
                <p className="text-sm font-semibold">
                  {activeBusiness.name}
                </p>
              </div>

              <button
                type="button"
                onClick={handleSwitchToPersonal}
                className="block w-full rounded-md px-3 py-2 text-left text-sm text-gray-600 hover:bg-gray-100"
              >
                ← Switch back to {user.name}
              </button>

              <div className="my-1 border-t" />
            </>
          )}

          {/* ───────── Personal account ───────── */}
          <div className="px-3 py-2">
            <p className="text-sm font-semibold">
              {user.name}
            </p>

            <Link
              href={`/profile/${user.id}`}
              onClick={() => setOpen(false)}
              className="text-xs text-gray-500 hover:underline"
            >
              View profile
            </Link>
          </div>

          <div className="my-1 border-t" />

          {/* ───────── Business list ───────── */}
          {!loaded ? (
            <p className="px-3 py-2 text-xs text-gray-400">
              Loading businesses...
            </p>
          ) : memberships.length === 0 ? (
            <p className="px-3 py-2 text-xs text-gray-400">
              You don&apos;t manage any business yet.
            </p>
          ) : (
            <div className="max-h-64 overflow-y-auto">
              {memberships.map((membership) => (
                <Link
                  key={membership.id}
                  href={`/business/${membership.entityId}`}
                  onClick={() => setOpen(false)}
                  className={`flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-gray-100 ${
                    activeBusiness?.id ===
                    membership.entityId
                      ? 'bg-gray-100 font-medium'
                      : ''
                  }`}
                >
                  <span>
                    {membership.entity?.name}
                  </span>
                  <span className="text-xs text-gray-400">
                    {membership.role}
                  </span>
                </Link>
              ))}
            </div>
          )}

          <div className="my-1 border-t" />

          <Link
            href="/my-businesses"
            onClick={() => setOpen(false)}
            className="block rounded-md px-3 py-2 text-sm text-gray-600 hover:bg-gray-100"
          >
            View all my businesses
          </Link>
        </div>
      )}
    </div>
  );
}