import { notFound } from 'next/navigation';

import { getUserProfile } from '@/services/user.service';
import ProfileHeader from '@/components/profile/ProfileHeader';
import BlockGuard from '@/components/blocks/BlockGuard';

type ProfileMedia = {
  id: string;
  url: string;
  type: string;
};

type ProfileLayoutProps = {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
};

export default async function ProfileLayout({
  children,
  params,
}: ProfileLayoutProps) {
  const { id } = await params;

  // অচেনা/ভুল id হলে 500 error না দেখিয়ে সাধারণ 404 page। শুধু "not found" হলেই;
  // অন্য কোনো সমস্যা (যেমন server বন্ধ) আগের মতোই error হিসেবে দেখায়।
  let response: Awaited<ReturnType<typeof getUserProfile>>;

  try {
    response = await getUserProfile(id);
  } catch (err) {
    if (err instanceof Error && /not found/i.test(err.message)) {
      notFound();
    }

    throw err;
  }

  const profile = response.data as {
    id: string;
    name: string;
    reviewCount: number;
    media?: ProfileMedia[];
  };

  const avatarUrl =
    profile.media?.find((m) => m.type === 'USER_PROFILE')
      ?.url ?? null;

  const coverPhotoUrl =
    profile.media?.find((m) => m.type === 'USER_COVER')
      ?.url ?? null;

  return (
    <BlockGuard kind="user" id={profile.id}>
    <main className="min-h-screen bg-gray-50 px-4 py-8">
      <div className="mx-auto max-w-5xl">
        <ProfileHeader
          profile={{
            id: profile.id,
            name: profile.name,
            reviewCount: profile.reviewCount,
            avatarUrl,
            coverPhotoUrl,
          }}
        />

        <div className="mt-6">{children}</div>
      </div>
    </main>
    </BlockGuard>
  );
}