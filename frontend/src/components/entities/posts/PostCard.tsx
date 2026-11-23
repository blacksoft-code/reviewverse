import { ReactNode } from 'react';

import PhotoGrid, {
  GridPhoto,
} from '@/components/media/PhotoGrid';

type PostCardProps = {
  name: string;
  logo?: string | null;
  content: string;
  media?: GridPhoto[];
  createdAt: string;
  authorLabel?: string;
  actions?: ReactNode;
  // Card-এর উপরের ডান কোণায় বসবে (যেমন ⋯ menu)
  menu?: ReactNode;
};

export default function PostCard({
  name,
  logo,
  content,
  media,
  createdAt,
  authorLabel,
  actions,
  menu,
}: PostCardProps) {
  return (
    // parent-এর পুরো চওড়া নেয় (Facebook post-এর মতো); মোবাইলে ভেতরের ফাঁকা কম (p-4)
    <div className="relative w-full rounded-2xl bg-white p-4 text-[#1d1d1f] shadow-[0_4px_24px_rgba(91,155,255,0.12)] ring-1 ring-black/[0.04] sm:rounded-3xl sm:p-6">
      {menu && (
        <div className="absolute right-3 top-3">{menu}</div>
      )}

      {/* ডান কোণার ⋯ menu-র নিচে লেখা যেন চাপা না পড়ে — pr-8 */}
      <div className="flex items-center gap-3 pr-8">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E6F4FD] ring-2 ring-[#8FD3F4]/60">
          {logo ? (
            <img
              src={logo}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-[#5B9BFF]">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold">
            {name}
          </p>

          <p className="text-xs text-[#6e6e73]">
            {new Date(createdAt).toLocaleString()}
            {authorLabel ? ` · ${authorLabel}` : ''}
          </p>
        </div>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-[15px] leading-6">
        {content}
      </p>

      {media && media.length > 0 && (
        <PhotoGrid photos={media} />
      )}

      {actions && (
        <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-black/5 pt-3">
          {actions}
        </div>
      )}
    </div>
  );
}