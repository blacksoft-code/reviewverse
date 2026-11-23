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
      <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E6F4FD] text-sm font-semibold text-[#5B9BFF] ring-2 ring-[#8FD3F4]/60">
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

      {/* মোবাইলে ছোট লেখা, বড় screen-এ পুরোটা */}
      <span className="min-w-0 flex-1 truncate rounded-full bg-[#F6F9FC] px-4 py-2.5 text-left text-sm text-[#6e6e73] transition hover:bg-[#E6F4FD]">
        What&apos;s on your mind, {firstName}?
        <span className="hidden sm:inline">
          {' '}
          Write a review...
        </span>
      </span>
    </>
  );

  // Facebook-এর "What's on your mind" box-এর মতো — parent-এর পুরো চওড়া, বড় screen-এ
  // সর্বোচ্চ 680px আর মাঝখানে (feed-এর post card-এর সাথে একই চওড়া)
  const baseClass = `mx-auto flex w-full max-w-[680px] items-center gap-3 rounded-2xl bg-white p-3 text-[#1d1d1f] shadow-[0_4px_24px_rgba(91,155,255,0.12)] ring-1 ring-black/[0.04] sm:rounded-3xl sm:p-4 ${className}`;

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