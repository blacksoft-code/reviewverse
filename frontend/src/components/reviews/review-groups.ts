import type { Review } from '@/services/review.service';

// (user + offering) প্রতি group-এর শুধু latest review-টা একটা top-level card;
// ঐ group-এর পুরনো review গুলো ঐ card-এর ভেতরে "more..."-এর নিচে যায়।
// Entity page আর user profile — দুই জায়গাই এই এক function ব্যবহার করে।
export type ReviewGroup = {
  latest: Review;
  older: Review[];
};

export function groupReviews(reviews: Review[]): ReviewGroup[] {
  return reviews
    .filter((review) => review.isLatest)
    .map((latest) => ({
      latest,
      older: reviews
        .filter(
          (r) =>
            !r.isLatest &&
            r.userId === latest.userId &&
            r.offeringId === latest.offeringId,
        )
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() -
            new Date(a.createdAt).getTime(),
        ),
    }));
}

// Review delete হলে local list ঠিক করা: backend যদি পুরনো কোনো review-কে
// আবার "latest" করে দেয় (promotedReview), সেটাও এখানে প্রতিফলিত হয়
export function removeReview(
  reviews: Review[],
  deletedId: string,
  promoted: Review | null,
): Review[] {
  const remaining = reviews.filter((r) => r.id !== deletedId);

  if (!promoted) return remaining;

  return remaining.map((r) =>
    r.id === promoted.id ? { ...r, isLatest: true } : r,
  );
}
