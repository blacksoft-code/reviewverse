'use client';

import { useEffect, useRef, useState } from 'react';

import type { Offering } from '@/services/offering.service';

type ServicesListProps = {
  offerings: Offering[];

  // Search result card থেকে এলে ?offering=<id> — এই offering-টা highlight হবে
  highlightId?: string;
};

function StarIcon() {
  return (
    <svg
      viewBox="0 0 20 20"
      className="h-3.5 w-3.5 fill-[#ff9f0a]"
      aria-hidden="true"
    >
      <path d="M10 1.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L10 14.8 4.8 17.6l1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
    </svg>
  );
}

export default function ServicesList({
  offerings,
  highlightId,
}: ServicesListProps) {
  // হাইলাইট থাকবে যতক্ষণ না user কোথাও click করে
  const [activeId, setActiveId] = useState<string | null>(
    highlightId ?? null,
  );

  const highlightedRef = useRef<HTMLLIElement | null>(null);

  // Highlight হওয়া offering টা list-এর নিচে থাকলেও যেন চোখে পড়ে
  useEffect(() => {
    if (!activeId) return;

    highlightedRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    });
    // শুধু প্রথমবার load-এ scroll — activeId বদলালে (null হলে) না
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // অন্য offering বা অন্য যেকোনো জায়গায় click করলেই highlight মিলিয়ে যায়
  useEffect(() => {
    if (!activeId) return;

    function dismiss() {
      setActiveId(null);

      // Refresh করলে যেন আবার highlight না আসে — URL থেকে ?offering সরিয়ে দিই
      const url = new URL(window.location.href);
      if (url.searchParams.has('offering')) {
        url.searchParams.delete('offering');
        window.history.replaceState(
          null,
          '',
          url.pathname + url.search + url.hash,
        );
      }
    }

    document.addEventListener('click', dismiss, {
      once: true,
    });

    return () =>
      document.removeEventListener('click', dismiss);
  }, [activeId]);

  return (
    <ul className="divide-y divide-black/5 border-t border-black/5 dark:divide-white/10 dark:border-white/10">
      {offerings.map((offering) => {
        const highlighted = offering.id === activeId;

        return (
          <li
            key={offering.id}
            ref={highlighted ? highlightedRef : undefined}
            className={`flex items-start gap-4 px-6 py-5 transition-all duration-500 sm:px-8 ${
              highlighted
                ? 'bg-[#0071e3]/[0.07] shadow-[inset_3px_0_0_#0071e3] dark:bg-[#0a84ff]/15 dark:shadow-[inset_3px_0_0_#0a84ff]'
                : 'hover:bg-black/[0.02] dark:hover:bg-white/[0.03]'
            }`}
          >
            {offering.media[0]?.url && (
              <img
                src={offering.media[0].url}
                alt={offering.name}
                className="h-24 w-24 flex-shrink-0 rounded-2xl object-cover ring-1 ring-black/5 dark:ring-white/10"
              />
            )}

            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h3 className="truncate text-[17px] font-semibold tracking-tight">
                    {offering.name}
                  </h3>

                  <div className="mt-1.5 flex items-center gap-2">
                    <span className="rounded-full bg-[#f5f5f7] px-2.5 py-0.5 text-xs font-medium text-[#6e6e73] dark:bg-white/10 dark:text-[#98989d]">
                      {offering.type}
                    </span>

                    {offering.averageRating > 0 && (
                      <span className="flex items-center gap-1 text-[13px] font-medium text-[#6e6e73] dark:text-[#98989d]">
                        <StarIcon />
                        {offering.averageRating.toFixed(1)}
                      </span>
                    )}
                  </div>
                </div>

                <span className="whitespace-nowrap text-[17px] font-semibold tracking-tight">
                  ৳{offering.price}
                </span>
              </div>

              {offering.description && (
                <p className="mt-3 max-w-prose whitespace-pre-line text-[15px] leading-6 text-[#6e6e73] dark:text-[#98989d]">
                  {offering.description}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ul>
  );
}
