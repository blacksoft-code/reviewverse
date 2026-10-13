import { redirect } from 'next/navigation';

// Offering manage করা এখন business dashboard-এই হয় — পুরনো link/bookmark ভাঙে না
export default async function ManageOfferingsRedirect({
  params,
}: {
  params: Promise<{ entityId: string }>;
}) {
  const { entityId } = await params;

  redirect(`/business/${entityId}?tab=offerings`);
}
