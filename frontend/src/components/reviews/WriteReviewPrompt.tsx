'use client';

import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';
import { useBusinessContext } from '@/context/BusinessContext';

type Props = {
  // Click করলে কোথায় যাবে। অন্য জায়গায় use করার সময় এটা বদলে দিলেই হবে।
  href?: string;

  // href-এর বদলে custom action চাইলে (যেমন modal খোলা)
  onClick?: () => void;

  className?: string;
};

// "What's on your mind, write a review?" — যেকোনো page-এ বসানো যাবে।
// Logged-out user বা business mode-এ থাকলে কিছু দেখাবে না।
export default function WriteReviewPrompt({
  href = '/write-review',
  onClick,
  className = '',
}: Props) {
  const { user, loading } = useAuth();
  const { activeBusiness } = useBusinessContext();

  if (loading || !user || activeBusiness) {
    return null;
  }

  const firstName = user.name.split(' ')[0];

  const content = (
    <>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-300 text-sm font-medium text-black">
        {user.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.avatarUrl}
            alt={user.name}
            className="h-full w-full object-cover"
          />
        ) : (
          user.name.charAt(0).toUpperCase()
        )}
      </span>

      <span className="flex-1 rounded-full border bg-gray-50 px-4 py-2.5 text-left text-sm text-gray-500 transition hover:bg-gray-100">
        What&apos;s on your mind, {firstName}? Write a review...
      </span>
    </>
  );

  const baseClass = `flex w-full items-center gap-3 rounded-lg border bg-white p-4 shadow-sm ${className}`;

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={baseClass}
      >
        {content}
      </button>
    );
  }

  return (
    <Link href={href} className={baseClass}>
      {content}
    </Link>
  );
}
