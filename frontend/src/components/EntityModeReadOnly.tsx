'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

import { useAuth } from '@/context/AuthContext';
import { useBusinessContext } from '@/context/BusinessContext';

// Entity mode-এ থাকা অবস্থায় public page (/entities/...) দেখলে সেটা
// শুধু দেখার জন্য (read-only): like/comment/share/follow ইত্যাদি কোনো
// interaction করা যায় না। একদম উপরে "Back to dashboard" button থাকে,
// আর শুধু সেটাই কাজ করে। (Link/tab-গুলো আগের মতো navigation করে)
export default function EntityModeReadOnly({
  children,
}: {
  children: ReactNode;
}) {
  const pathname = usePathname();
  const { user } = useAuth();
  const { activeBusiness } = useBusinessContext();

  const readOnly =
    !!user &&
    !!activeBusiness &&
    pathname.startsWith('/entities/');

  // interaction হতে পারে এমন সব control-এর click/submit/typing আটকে দেওয়া
  function isControl(target: EventTarget | null) {
    return (
      target instanceof HTMLElement &&
      !!target.closest(
        'button, input, textarea, select, [role="button"]',
      )
    );
  }

  function blockInteraction(e: React.SyntheticEvent) {
    if (isControl(e.target)) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  if (!readOnly || !activeBusiness) {
    return <>{children}</>;
  }

  return (
    <>
      {/* একদম উপরে — শুধু এটাই কাজ করে */}
      <div className="sticky top-0 z-40 flex items-center gap-4 border-b bg-gray-900 px-6 py-3">
        <Link
          href={`/business/${activeBusiness.id}`}
          className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-black hover:bg-gray-200"
        >
          ← Back to dashboard
        </Link>

        <p className="text-sm text-gray-400">
          Viewing as {activeBusiness.name} — preview only,
          interactions are turned off.
        </p>
      </div>

      <div
        className="entity-readonly flex flex-1 flex-col"
        onClickCapture={blockInteraction}
        onSubmitCapture={blockInteraction}
        onKeyDownCapture={(e) => {
          // control-এ typing / Enter / Space বন্ধ
          if (isControl(e.target)) e.preventDefault();
        }}
      >
        {children}
      </div>
    </>
  );
}
