'use client';

import { useEffect, useState } from 'react';

import PostCard from './PostCard';
import PostReactionButton from './PostReactionButton';
import PostCommentSection from './PostCommentSection';
import {
  getPublicFeed,
  PublicEntityPost,
} from '@/services/entity-post.service';

type EntityPublicPostsFeedProps = {
  entityId: string;
};

export default function EntityPublicPostsFeed({
  entityId,
}: EntityPublicPostsFeedProps) {
  const [posts, setPosts] = useState<
    PublicEntityPost[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const response = await getPublicFeed(entityId);
        setPosts(response.data);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load posts',
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [entityId]);

  if (loading) {
    return (
      <p className="text-sm text-gray-500">
        Loading posts...
      </p>
    );
  }

  if (error) {
    return (
      <p className="text-sm text-red-600">{error}</p>
    );
  }

  if (posts.length === 0) {
    return (
      <p className="text-sm text-gray-500">
        No posts yet.
      </p>
    );
  }

  return (
    <div className="space-y-4">
     {posts.map((post) => (
      <div key={post.id}>
        <PostCard
          name={post.entity.name}
          logo={post.entity.logo}
          content={post.content}
          media={post.media}
          createdAt={post.createdAt}
        />

        <div className="px-5 pb-4">
          <PostReactionButton postId={post.id} />
          <PostCommentSection postId={post.id} />
        </div>
      </div>
    ))}
    </div>
  );
}