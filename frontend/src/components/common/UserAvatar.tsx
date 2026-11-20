// গোল avatar — profile ছবি থাকলে ছবি, না থাকলে নামের প্রথম অক্ষর।
// Review card, Share card সব জায়গায় এটাই ব্যবহার হয়।
export default function UserAvatar({
  name,
  url,
  size = 'md',
}: {
  name: string;
  url?: string | null;
  size?: 'sm' | 'md';
}) {
  const box =
    size === 'sm' ? 'h-7 w-7 text-xs' : 'h-9 w-9 text-sm';

  return (
    <span
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 font-bold text-gray-600 ${box}`}
    >
      {url ? (
        <img
          src={url}
          alt={name}
          className="h-full w-full object-cover"
        />
      ) : (
        name.charAt(0).toUpperCase()
      )}
    </span>
  );
}
