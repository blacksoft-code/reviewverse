// Backend review/share-এর user-এ profile ছবি আসে media[0].url হিসেবে
// (USER_PROFILE media)। ছবি না থাকলে null — তখন নামের প্রথম অক্ষর দেখানো হয়।
export type UserWithAvatar = {
  name: string;
  media?: { url: string }[];
};

export function getAvatarUrl(
  user?: { media?: { url: string }[] } | null,
): string | null {
  return user?.media?.[0]?.url ?? null;
}
