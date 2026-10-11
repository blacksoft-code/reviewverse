import type { FeedEntry } from '@/services/feed.service';

import FeedItem from './FeedItem';
import FeedPostCard from './FeedPostCard';
import SharedCard from '@/components/shares/SharedCard';

export default function FeedEntryCard({
  entry,
}: {
  entry: FeedEntry;
}) {
  if (entry.type === 'share') {
    return <SharedCard share={entry.share} />;
  }

  if (entry.type === 'post') {
    return <FeedPostCard post={entry.post} />;
  }

  return <FeedItem review={entry.review} />;
}