'use client';

import { FormEvent, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import PostCard from '@/components/entities/posts/PostCard';

import {
  ManagedEntityPost,
  createPost,
  deletePost,
  getManageFeed,
  updatePost,
} from '@/services/entity-post.service';

export default function ManageEntityPostsPage() {
  const params = useParams();
  const router = useRouter();

  const entityId = params.entityId as string;

  const { user, loading: authLoading } = useAuth();

  const [posts, setPosts] = useState<
    ManagedEntityPost[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // নতুন post ফর্ম
  const [content, setContent] = useState('');
  const [image, setImage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // edit করার state
  const [editingPostId, setEditingPostId] = useState<
    string | null
  >(null);
  const [editingContent, setEditingContent] =
    useState('');
  const [editingImage, setEditingImage] = useState('');
  const isSubmittingRef = useRef(false);

  const [actingOn, setActingOn] = useState<
    string | null
  >(null);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    loadPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, entityId]);

  async function loadPosts() {
    try {
      setLoading(true);
      const response = await getManageFeed(entityId);
      setPosts(response.data);
      setError('');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'You do not have access to manage this business.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(e: FormEvent) {
  e.preventDefault();

  // একদম কাছাকাছি সময়ে দুইবার submit ঠেকানোর জন্য (state async, ref sync)
  if (isSubmittingRef.current) {
    return;
  }

  isSubmittingRef.current = true;
  setError('');
  setSubmitting(true);

  try {
    const response = await createPost(entityId, {
      content,
      image: image || undefined,
    });

    setPosts((prev) => [response.data, ...prev]);
    setContent('');
    setImage('');
  } catch (err) {
    setError(
      err instanceof Error
        ? err.message
        : 'Failed to create post',
    );
  } finally {
    setSubmitting(false);
    isSubmittingRef.current = false;
  }
}

  function startEditing(post: ManagedEntityPost) {
    setEditingPostId(post.id);
    setEditingContent(post.content);
    setEditingImage(post.image ?? '');
  }

  function cancelEditing() {
    setEditingPostId(null);
    setEditingContent('');
    setEditingImage('');
  }

  async function handleUpdate(postId: string) {
    setActingOn(postId);
    setError('');

    try {
      const response = await updatePost(postId, {
        content: editingContent,
        image: editingImage || undefined,
      });

      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? response.data : p,
        ),
      );

      cancelEditing();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update post',
      );
    } finally {
      setActingOn(null);
    }
  }

  async function handleDelete(postId: string) {
    setActingOn(postId);
    setError('');

    try {
      await deletePost(postId);
      setPosts((prev) =>
        prev.filter((p) => p.id !== postId),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete post',
      );
    } finally {
      setActingOn(null);
    }
  }

  if (authLoading || loading) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-gray-500">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="mx-auto max-w-3xl">
        <Link
          href="/my-businesses"
          className="text-sm text-gray-500 hover:text-black"
        >
          ← Back to my businesses
        </Link>

        <h1 className="mt-4 text-2xl font-bold">
          Manage Posts
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Posts you publish here appear publicly under
          your business name — the specific
          owner/manager/employee who wrote it is only
          visible here.
        </p>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* ================================= */}
        {/* CREATE FORM */}
        {/* ================================= */}

        <form
          onSubmit={handleCreate}
          className="mt-6 rounded-xl border bg-white p-5"
        >
          <textarea
            value={content}
            onChange={(e) =>
              setContent(e.target.value)
            }
            placeholder="What's new with your business?"
            required
            rows={3}
            className="w-full resize-none rounded-lg border p-3 text-sm"
          />

          <input
            type="url"
            value={image}
            onChange={(e) =>
              setImage(e.target.value)
            }
            placeholder="Image URL (optional)"
            className="mt-3 w-full rounded-lg border p-2.5 text-sm"
          />

          <button
            type="submit"
            disabled={submitting}
            className="mt-3 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {submitting ? 'Posting...' : 'Post'}
          </button>
        </form>

        {/* ================================= */}
        {/* POSTS LIST */}
        {/* ================================= */}

        <div className="mt-8 space-y-4">
          {posts.length === 0 ? (
            <p className="text-sm text-gray-500">
              No posts yet — publish your first update
              above.
            </p>
          ) : (
            posts.map((post) =>
              editingPostId === post.id ? (
                <div
                  key={post.id}
                  className="rounded-xl border bg-white p-5"
                >
                  <textarea
                    value={editingContent}
                    onChange={(e) =>
                      setEditingContent(
                        e.target.value,
                      )
                    }
                    rows={3}
                    className="w-full resize-none rounded-lg border p-3 text-sm"
                  />

                  <input
                    type="url"
                    value={editingImage}
                    onChange={(e) =>
                      setEditingImage(
                        e.target.value,
                      )
                    }
                    placeholder="Image URL (optional)"
                    className="mt-3 w-full rounded-lg border p-2.5 text-sm"
                  />

                  <div className="mt-3 flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleUpdate(post.id)
                      }
                      disabled={
                        actingOn === post.id
                      }
                      className="rounded-lg bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                    >
                      Save
                    </button>

                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="rounded-lg border px-4 py-2 text-sm font-medium hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <PostCard
                  key={post.id}
                  name={user?.name ?? 'Your business'}
                  content={post.content}
                  image={post.image}
                  createdAt={post.createdAt}
                 authorLabel={
                    post.author
                        ? `Posted by ${post.author.name}`
                        : undefined
                    }
                  actions={
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          startEditing(post)
                        }
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-gray-50"
                      >
                        Edit
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDelete(post.id)
                        }
                        disabled={
                          actingOn === post.id
                        }
                        className="rounded-lg border px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        {actingOn === post.id
                          ? '...'
                          : 'Delete'}
                      </button>
                    </>
                  }
                />
              ),
            )
          )}
        </div>
      </div>
    </main>
  );
}