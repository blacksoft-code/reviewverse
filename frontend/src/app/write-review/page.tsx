import WriteReviewFlow from '@/components/reviews/WriteReviewFlow';

export default function WriteReviewPage() {
  return (
    <main className="apple-ui min-h-screen px-4 py-10">
      <div className="mx-auto max-w-xl">
        <h1 className="text-3xl font-semibold">
          Write a review
        </h1>
        <p className="mt-1 mb-6 text-[15px] text-[#86868b]">
          Find a business, pick what you tried, and share
          your experience.
        </p>

        <WriteReviewFlow/>
      </div>
    </main>
  );
}
