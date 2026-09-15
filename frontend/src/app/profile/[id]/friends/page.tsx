import { getUserProfile } from '@/services/user.service';
import FriendsContent from '@/components/profile/FriendsContent';

type FriendsPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function FriendsPage({
  params,
}: FriendsPageProps) {
  const { id } = await params;

  const response = await getUserProfile(id);
  const user = response.data;

  return (
    <FriendsContent
      userId={user.id}
      userName={user.name}
    />
  );
}