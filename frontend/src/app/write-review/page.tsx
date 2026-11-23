import Link from 'next/link';

import WriteReviewFlow from '@/components/reviews/WriteReviewFlow';

export default function WriteReviewPage() {
  return (
    // উপরে হালকা আকাশি নীল, নিচে নামতে নামতে অফ-হোয়াইট
    <main className="min-h-screen bg-gradient-to-b from-[#CFEBFB] via-[#E6F4FD] to-[#F6F9FC] px-3 py-6 text-[#1d1d1f] sm:px-4 sm:py-10">
      {/* ফর্মের কার্ডগুলোর সাথে একই চওড়া (680px) */}
      <div className="mx-auto w-full max-w-[680px]">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-2xl font-semibold sm:text-3xl">
              Write a review
            </h1>
            <p className="mb-5 mt-1 text-[15px] text-[#6e6e73] sm:mb-6">
              Find a business, pick what you tried, and
              share your experience.
            </p>
          </div>

          {/* Close — review create না করেই feed-এ ফিরে যায় */}
          <Link
            href="/"
            aria-label="Close"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/80 text-[#6e6e73] shadow-sm ring-1 ring-black/[0.04] transition hover:bg-white"
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