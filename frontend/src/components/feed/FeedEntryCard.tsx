import type { FeedEntry } from '@/services/feed.service';

import FeedItem from './FeedItem';
import FeedPostCard from './FeedPostCard';

export default function FeedEntryCard({
  entry,
}: {
  entry: FeedEntry;
}) {
  if (entry.type === 'post') {
    return <FeedPostCard post={entry.post} />;
  }

  return <FeedItem review={entry.review} />;
}