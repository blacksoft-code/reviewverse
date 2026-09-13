import Link from 'next/link';

import type { FeedPost } from '@/services/feed.service';
import PhotoGrid from '@/components/media/PhotoGrid';

export default function FeedPostCard({
  post,
}: {
  post: FeedPost;
}) {
  return (
    <div className="rounded-lg border p-5">
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-gray-200">
          {post.entity.logo ? (
            <img
              src={post.entity.logo}
              alt={post.entity.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-bold text-gray-500">
              {post.entity.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <Link
          href={`/entities/${encodeURIComponent(post.entity.slug)}`}
          className="font-medium hover:underline"
        >
          {post.entity.name}
        </Link>

        <span className="ml-auto text-xs text-gray-400">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="mt-3 whitespace-pre-wrap text-sm">
        {post.content}
      </p>

      {post.media && post.media.length > 0 && (
        <PhotoGrid photos={post.media} />
      )}
    </div>
  );
}