'use client';

import ReactionBar from '@/components/reactions/ReactionBar';
import {
  getPostReactionSummary,
  getPostReactors,
  reactToPost,
  unreactToPost,
} from '@/services/post-reaction.service';

// Entity post-এর reaction — UI/লজিক সব ReactionBar-এ (review/share-এর সাথে এক)
export default function PostReactionButton({
  postId,
}: {
  postId: string;
}) {
  return (
    <ReactionBar
      targetId={postId}
      adapter={{
        getSummary: () => getPostReactionSummary(postId),
        react: (type) => reactToPost(postId, type),
        unreact: () => unreactToPost(postId),
        getReactors: () => getPostReactors(postId),
      }}
    />
  );
}
