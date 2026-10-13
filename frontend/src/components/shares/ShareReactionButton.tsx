'use client';

import ReactionBar from '@/components/reactions/ReactionBar';
import {
  getShareReactionSummary,
  getShareReactors,
  reactToShare,
  unreactToShare,
} from '@/services/share.service';

// Share-এর reaction — UI/লজিক সব ReactionBar-এ (review/post-এর সাথে এক)
export default function ShareReactionButton({
  shareId,
}: {
  shareId: string;
}) {
  return (
    <ReactionBar
      targetId={shareId}
      adapter={{
        getSummary: () => getShareReactionSummary(shareId),
        react: (type) => reactToShare(shareId, type),
        unreact: () => unreactToShare(shareId),
        getReactors: () => getShareReactors(shareId),
      }}
    />
  );
}
