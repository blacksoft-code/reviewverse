'use client';

import SharedCard from '@/components/shares/SharedCard';
import { getUserShares, ShareItem } from '@/services/share.service';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/services/user.service';
import { Review } from '@/services/review.service';

import ReviewCard from '@/components/reviews/ReviewCard';
import {
  groupReviews,
  removeReview,
} from '@/components/reviews/review-groups';

type ProfileUser = {
  id: string;
  name: string;
  createdAt: string;
  reviewCount: number;
  reviews: Review[];
};

export default function ProfilePage() {
  const params = useParams();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const profileId = params.id as string;

  const [profile, setProfile] =
    useState<ProfileUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // Review গুলো আলাদা state-এ, যাতে ReviewCard থেকে edit/delete করলে সাথে সাথে বদলায়
  const [reviews, setReviews] = useState<Review[]>([]);

  // এই user-এর share করা review/post — reviews-এর সাথে মিশিয়ে দেখানো হয়
  const [shares, setShares] = useState<ShareItem[]>([]);

  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);
        setError('');
        const [response, sharesRes] = await Promise.all([
          getUserProfile(profileId),
          getUserShares(profileId).catch(() => null),
        ]);
        setProfile(response.data as ProfileUser);
        setReviews((response.data as ProfileUser).reviews ?? []);
        setShares(sharesRes?.data ?? []);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load profile.',
        );
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [profileId]);

  if (loading) {
    return <p className="text-gray-500">Loading reviews...</p>;
  }

  if (!profile) {
    return (
      <div className="rounded-xl bg-white p-6 text-red-600 shadow-sm">
        {error || 'Profile not found.'}
      </div>
    );
  }

  // Review (প্রতি group-এর latest, পুরনোগুলো "more..."-এ) আর share এক
  // timeline-এ, সবচেয়ে নতুন আগে
  const timeline = [
    ...groupReviews(reviews).map((group) => ({
      kind: 'review' as const,
      id: group.latest.id,
      createdAt: group.latest.createdAt,
      group,
    })),
    ...shares.map((share) => ({
      kind: 'share' as const,
      id: share.id,
      createdAt: share.createdAt,
      share,
    })),
  ].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() -
      new Date(a.createdAt).getTime(),
  );

  return (
    <section>
      <h2 className="text-2xl font-bold text-gray-900">
        Reviews &amp; shares
      </h2>

      <div className="mt-4 space-y-5">
        {timeline.length === 0 ? (
          <div className="rounded-xl bg-white p-6 text-gray-500 shadow-sm">
            No reviews yet.
          </div>
        ) : (
          timeline.map((item) => {
            if (item.kind === 'share') {
              return (
                <div
                  key={`share-${item.id}`}
                  className="rounded-xl bg-white p-4 text-gray-900 shadow-sm"
                >
                  <SharedCard
                    share={item.share}
                    onDeleted={(shareId) =>
                      setShares((prev) =>
                        prev.filter((s) => s.id !== shareId),
                      )
                    }
                  />
                </div>
              );
            }

            const { latest, older } = item.group;

            return (
              <ReviewCard
                key={latest.id}
                review={latest}
                olderReviews={older}
                variant="profile"
                currentUserId={currentUser?.id}
                entityId={latest.entityId}
                onUpdated={(updated) => {
                  setReviews((current) =>
                    current.map((r) =>
                      r.id === updated.id ? updated : r,
                    ),
                  );
                  router.refresh();
                }}
                onDeleted={(reviewId, promoted) => {
                  setReviews((current) =>
                    removeReview(current, reviewId, promoted),
                  );
                  router.refresh();
                }}
              />
            );
          })
        )}
      </div>
    </section>
  );
}