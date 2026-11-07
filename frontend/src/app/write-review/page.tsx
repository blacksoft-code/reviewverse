import Link from 'next/link';

import WriteReviewFlow from '@/components/reviews/WriteReviewFlow';

export default function WriteReviewPage() {
  return (
    <main className="apple-ui min-h-screen px-4 py-10">
      <div className="mx-auto max-w-xl">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold">
              Write a review
            </h1>
            <p className="mt-1 mb-6 text-[15px] text-[#86868b]">
              Find a business, pick what you tried, and
              share your experience.
            </p>
          </div>

          {/* Close — review create না করেই feed-এ ফিরে যায় */}
          <Link
            href="/"
            aria-label="Close"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-black/5 text-[#6e6e73] transition hover:bg-black/10"
          >
            <svg
              viewBox="0 0 16 16"
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M3 3l10 10M13 3L3 13" />
            </svg>
          </Link>
        </div>

        <WriteReviewFlow />
      </div>
    </main>
  );
}