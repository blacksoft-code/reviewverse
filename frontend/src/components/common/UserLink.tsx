import Link from 'next/link';

// যেকোনো জায়গায় "একজন user (বা business)" দেখানোর একটাই component:
// avatar (logo বা নামের প্রথম অক্ষর) + নাম, click করলে তার profile-এ যায়।
// Business হিসেবে কিছু করলে (entity দিলে) business-এর page-এ যায়।
// Link-এর path বা style বদলাতে হলে শুধু এখানে বদলালেই সব জায়গায় বদলাবে।
export type UserLinkEntity = {
  slug: string;
  name: string;
  logo: string | null;
};

export default function UserLink({
  userId,
  name,
  entity,
  suffix,
  onNavigate,
  className = '',
}: {
  userId: string;
  name: string;
  entity?: UserLinkEntity | null;
  suffix?: string;
  onNavigate?: () => void;
  className?: string;
}) {
  const displayName = entity?.name ?? name;

  const href = entity
    ? `/entities/${encodeURIComponent(entity.slug)}`
    : `/profile/${encodeURIComponent(userId)}`;

  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex min-w-0 items-center gap-3 ${className}`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 text-sm font-bold text-gray-600">
        {entity?.logo ? (
          <img
            src={entity.logo}
            alt={displayName}
            className="h-full w-full object-cover"
          />
        ) : (
          displayName.charAt(0).toUpperCase()
        )}
      </span>

      <span className="truncate text-sm font-medium hover:underline">
        {displayName}
        {suffix && (
          <span className="ml-1 font-normal text-gray-400">
            {suffix}
          </span>
        )}
      </span>
    </Link>
  );
}
