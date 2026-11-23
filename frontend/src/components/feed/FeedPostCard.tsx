import Link from 'next/link';

import type { FeedPost } from '@/services/feed.service';
import PhotoGrid from '@/components/media/PhotoGrid';
import PostReactionButton from '@/components/entities/posts/PostReactionButton';
import PostCommentSection from '@/components/entities/posts/PostCommentSection';
import ShareButton from '@/components/shares/ShareButton';

export default function FeedPostCard({
  post,
}: {
  post: FeedPost;
}) {
  return (
    // Facebook post-এর মতো — parent-এর পুরো চওড়া নেয়, বড় screen-এ সর্বোচ্চ 680px
    // আর মাঝখানে বসে। মোবাইলে ভেতরের ফাঁকা কম (p-4)।
    <div className="mx-auto w-full max-w-[680px] rounded-2xl bg-white p-4 text-[#1d1d1f] shadow-[0_4px_24px_rgba(91,155,255,0.12)] ring-1 ring-black/[0.04] sm:rounded-3xl sm:p-6">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E6F4FD] ring-2 ring-[#8FD3F4]/60">
          {post.entity.logo ? (
            <img
              src={post.entity.logo}
              alt={post.entity.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-sm font-bold text-[#5B9BFF]">
              {post.entity.name.charAt(0).toUpperCase()}
            </span>
          )}
        </div>

        <Link
          href={`/entities/${encodeURIComponent(post.entity.slug)}`}
          className="min-w-0 truncate text-[15px] font-semibold hover:underline"
        >
          {post.entity.name}
        </Link>

        <span className="ml-auto shrink-0 rounded-full bg-[#F6F9FC] px-3 py-1 text-xs text-[#6e6e73]">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>

      <p className="mt-4 whitespace-pre-wrap text-[15px] leading-6">
        {post.content}
      </p>

      {post.media && post.media.length > 0 && (
        <PhotoGrid photos={post.media} />
      )}

      <div className="mt-4 border-t border-black/5 pt-3">
        <PostReactionButton postId={post.id} />
        <ShareButton entityPostId={post.id} />
        <PostCommentSection postId={post.id} />
      </div>
    </div>
  );
}