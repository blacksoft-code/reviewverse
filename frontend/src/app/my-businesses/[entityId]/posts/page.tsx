import { redirect } from 'next/navigation';

// Post manage করা এখন business dashboard-এই হয় — পুরনো link/bookmark ভাঙে না
export default async function ManagePostsRedirect({
  params,
}: {
  params: Promise<{ entityId: string }>;
}) {
  const { entityId } = await params;

  redirect(`/business/${entityId}?tab=posts`);
}
