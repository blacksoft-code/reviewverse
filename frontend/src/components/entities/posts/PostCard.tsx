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
};

export default function PostCard({
  name,
  logo,
  content,
  media,
  createdAt,
  authorLabel,
  actions,
}: PostCardProps) {
  return (
    <div className="rounded-xl border bg-black p-5 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-200">
          {logo ? (
            <img
              src={logo}
              alt={name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-gray-500">
              {name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <div>
          <p className="font-semibold">{name}</p>

          <p className="text-xs text-gray-500">
            {new Date(createdAt).toLocaleString()}
            {authorLabel ? ` · ${authorLabel}` : ''}
          </p>
        </div>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm">
        {content}
      </p>

      {media && media.length > 0 && (
        <PhotoGrid photos={media} />
      )}

      {actions && (
        <div className="mt-4 flex gap-2 border-t pt-3">
          {actions}
        </div>
      )}
    </div>
  );
}