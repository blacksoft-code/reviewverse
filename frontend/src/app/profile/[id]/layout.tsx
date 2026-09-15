import { getUserProfile } from '@/services/user.service';
import ProfileHeader from '@/components/profile/ProfileHeader';

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

  const response = await getUserProfile(id);

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
  );
}