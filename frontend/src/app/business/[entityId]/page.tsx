'use client';

import {
  FormEvent,
  useEffect,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';
import PostCard from '@/components/entities/posts/PostCard';
import { useBusinessContext } from '@/context/BusinessContext';

import {
  ManagedEntityPost,
  createPost,
  deletePost,
  getManageFeed,
  updatePost,
} from '@/services/entity-post.service';

import {
  EntityDetail,
  getEntityById,
  updateEntity,
} from '@/services/entity-management.service';

// Media components
import MultiImageUploader from '@/components/media/MultiImageUploader';
import SingleImageUploader from '@/components/media/SingleImageUploader';

// Media service
import { uploadImages } from '@/services/media.service';

type Tab = 'posts' | 'info';

export default function BusinessHomePage() {
  const params = useParams();
  const router = useRouter();
  const entityId = params.entityId as string;

  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<Tab>('posts');

  const [entity, setEntity] =
    useState<EntityDetail | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ───────── Posts state ─────────

  const [posts, setPosts] = useState<
    ManagedEntityPost[]
  >([]);

  const [content, setContent] = useState('');

  // নতুন Media system:
  // Post-এর জন্য একাধিক image/file রাখা হবে।
  const [postPhotos, setPostPhotos] =
    useState<File[]>([]);

  const [submitting, setSubmitting] = useState(false);

  const isSubmittingRef = useRef(false);

  // ───────── Edit Post state ─────────

  const [editingPostId, setEditingPostId] =
    useState<string | null>(null);

  const [editingContent, setEditingContent] =
    useState('');

  const [actingOn, setActingOn] = useState<
    string | null
  >(null);

  // ───────── Edit Info state ─────────

  const [form, setForm] = useState<
    Partial<EntityDetail>
  >({});

  const [savingInfo, setSavingInfo] = useState(false);
  const [infoSaved, setInfoSaved] = useState(false);

  const { setActiveBusiness } = useBusinessContext();

  // ─────────────────────────────
  // Auth + initial loading
  // ─────────────────────────────

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    loadAll();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, entityId]);

  // ─────────────────────────────
  // Clear active business
  // when leaving this page
  // ─────────────────────────────

  useEffect(() => {
    return () => {
      setActiveBusiness(null);
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─────────────────────────────
  // Load business + posts
  // ─────────────────────────────

  async function loadAll() {
    try {
      setLoading(true);

      const [entityRes, postsRes] =
        await Promise.all([
          getEntityById(entityId),
          getManageFeed(entityId),
        ]);

      setEntity(entityRes.data);
      setForm(entityRes.data);

      // Navbar-কে জানাচ্ছি কোন business active
      setActiveBusiness({
        id: entityRes.data.id,
        name: entityRes.data.name,
        logo: entityRes.data.logo,
      });

      setPosts(postsRes.data);

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

  // ─────────────────────────────
  // Create Post
  // ─────────────────────────────

  async function handleCreate(e: FormEvent) {
    e.preventDefault();

    // Prevent duplicate submit
    if (isSubmittingRef.current) {
      return;
    }

    isSubmittingRef.current = true;

    setError('');
    setSubmitting(true);

    try {
      // ─────────────────────────────
      // Step 1:
      // আগে শুধু Post তৈরি করছি
      // ─────────────────────────────

      const response = await createPost(entityId, { content,});
      let post = response.data;

      // ─────────────────────────────
      // Step 2:
      // Post তৈরি হওয়ার পরে তার ID পাওয়া গেছে।
      // এখন selected photos Media table-এ upload হবে।
      // ─────────────────────────────

      if (postPhotos.length > 0) {
        const media = await uploadImages(
          postPhotos,
          'ENTITY_POST',
          post.id,
        );

        // Uploaded media post-এর সাথে attach করছি
        post = { ...post, media, };
      }

      // ─────────────────────────────
      // Step 3:
      // নতুন post feed-এর উপরে যোগ করছি
      // ─────────────────────────────

      setPosts((prev) => [post, ...prev]);

      // Form reset
      setContent('');
      setPostPhotos([]);
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

  // ─────────────────────────────
  // Start editing post
  // ─────────────────────────────

  function startEditing(post: ManagedEntityPost) {
    setEditingPostId(post.id);
    setEditingContent(post.content);
  }

  // ─────────────────────────────
  // Cancel editing
  // ─────────────────────────────

  function cancelEditing() {
    setEditingPostId(null);
    setEditingContent('');
  }

  // ─────────────────────────────
  // Update Post
  // ─────────────────────────────

  async function handleUpdatePost(postId: string) {
    setActingOn(postId);
    setError('');

    try {
      const response = await updatePost(postId, {
        content: editingContent,
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

  // ─────────────────────────────
  // Delete Post
  // ─────────────────────────────

  async function handleDeletePost(postId: string) {
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

  // ─────────────────────────────
  // Edit Business Info
  // ─────────────────────────────

  function handleFormChange(
    field: keyof EntityDetail,
    value: string,
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));

    setInfoSaved(false);
  }

  // ─────────────────────────────
  // Save Business Info
  // ─────────────────────────────

  async function handleSaveInfo(e: FormEvent) {
    e.preventDefault();

    setSavingInfo(true);
    setError('');

    try {
      const response = await updateEntity(
        entityId,
        {
          name: form.name,

          description:
            form.description ?? undefined,

          location:
            form.location ?? undefined,

          phone:
            form.phone ?? undefined,

          website:
            form.website || undefined,

          email:
            form.email ?? undefined,

          businessHours:
            form.businessHours ?? undefined,

          priceRange:
            form.priceRange ?? undefined,

          serviceOptions:
            form.serviceOptions ?? undefined,

          coverPhoto:
            form.coverPhoto || undefined,

          logo:
            form.logo || undefined,

          amenities:
            form.amenities ?? undefined,

          paymentMethods:
            form.paymentMethods ?? undefined,

          socialLinks:
            form.socialLinks ?? undefined,

          menu:
            form.menu || undefined,
        },
      );

      setEntity(response.data);
      setForm(response.data);
      setInfoSaved(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update business info',
      );
    } finally {
      setSavingInfo(false);
    }
  }

  // ─────────────────────────────
  // Loading
  // ─────────────────────────────

  if (authLoading || loading) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-gray-500">
          Loading...
        </p>
      </main>
    );
  }

  // ─────────────────────────────
  // Business not found
  // ─────────────────────────────

  if (!entity) {
    return (
      <main className="min-h-screen p-8">
        <p className="text-sm text-red-600">
          {error || 'Business not found.'}
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50 pb-16">

      {/* ───────────────────────────── */}
      {/* Header */}
      {/* ───────────────────────────── */}

      <div className="border-b bg-white">
        <div className="mx-auto max-w-3xl px-6 py-6">

          <Link
            href="/my-businesses"
            className="text-sm text-gray-500 hover:text-black"
          >
            ← My Businesses
          </Link>

          <div className="mt-3 flex items-center gap-4">

            {/* Business logo */}
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full bg-gray-200">

              {entity.logo ? (
                <img
                  src={entity.logo}
                  alt={entity.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-lg font-bold text-gray-500">
                  {entity.name
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}

            </div>

            <div>

              <h1 className="text-2xl font-bold">
                {entity.name}
              </h1>

              <Link
                href={`/entities/${entity.slug}`}
                className="text-sm text-gray-500 hover:underline"
              >
                View public page →
              </Link>

            </div>
          </div>

          {/* ───────────────────────────── */}
          {/* Tabs */}
          {/* ───────────────────────────── */}

          <div className="mt-5 flex gap-2 border-b">

            <button
              type="button"
              onClick={() => setTab('posts')}
              className={`border-b-2 px-4 py-2 text-sm font-medium ${
                tab === 'posts'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              Posts
            </button>

            <button
              type="button"
              onClick={() => setTab('info')}
              className={`border-b-2 px-4 py-2 text-sm font-medium ${
                tab === 'info'
                  ? 'border-black text-black'
                  : 'border-transparent text-gray-500 hover:text-black'
              }`}
            >
              Edit Info
            </button>

          </div>

        </div>
      </div>

      <div className="mx-auto max-w-3xl px-6">

        {/* Error */}
        {error && (
          <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
            {error}
          </p>
        )}

        {/* ================================================= */}
        {/* POSTS TAB */}
        {/* ================================================= */}

        {tab === 'posts' && (
          <div className="mt-6">

            {/* ───────────────────────────── */}
            {/* Create Post */}
            {/* ───────────────────────────── */}

            <form
              onSubmit={handleCreate}
              className="rounded-xl border bg-black p-5"
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

              {/* ───────────────────────────── */}
              {/* Multiple Post Images */}
              {/* ───────────────────────────── */}

              <div className="mt-3">
                <MultiImageUploader
                  maxFiles={10}
                  onChange={setPostPhotos}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="mt-3 rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
              >
                {submitting
                  ? 'Posting...'
                  : 'Post'}
              </button>

            </form>

            {/* ───────────────────────────── */}
            {/* Posts List */}
            {/* ───────────────────────────── */}

            <div className="mt-6 space-y-4">

              {posts.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No posts yet — publish your
                  first update above.
                </p>
              ) : (
                posts.map((post) =>
                  editingPostId === post.id ? (

                    /* ─────────────────────── */
                    /* Edit Post */
                    /* ─────────────────────── */

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

                      <div className="mt-3 flex gap-2">

                        <button
                          type="button"
                          onClick={() =>
                            handleUpdatePost(
                              post.id,
                            )
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

                    /* ─────────────────────── */
                    /* Normal Post */
                    /* ─────────────────────── */

                    <PostCard
                      key={post.id}

                      name={entity.name}

                      logo={entity.logo}

                      content={post.content}

                      // পুরোনো image-এর পরিবর্তে
                      // এখন Media array পাঠানো হচ্ছে
                      media={post.media ?? []}

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
                              handleDeletePost(
                                post.id,
                              )
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
        )}

        {/* ================================================= */}
        {/* EDIT INFO TAB */}
        {/* ================================================= */}

        {tab === 'info' && (
          <form
            onSubmit={handleSaveInfo}
            className="mt-6 space-y-4 rounded-xl border bg-black p-6"
          >

            {/* Success message */}
            {infoSaved && (
              <p className="rounded-lg bg-green-50 p-3 text-sm text-green-700">
                Business info updated successfully.
              </p>
            )}

            {/* ───────────────────────────── */}
            {/* Business Name */}
            {/* ───────────────────────────── */}

            <div>
              <label className="text-sm font-medium">
                Business name
              </label>

              <input
                value={form.name ?? ''}
                onChange={(e) =>
                  handleFormChange(
                    'name',
                    e.target.value,
                  )
                }
                className="mt-1 w-full rounded-lg border p-2.5 text-sm"
              />
            </div>

            {/* ───────────────────────────── */}
            {/* Description */}
            {/* ───────────────────────────── */}

            <div>
              <label className="text-sm font-medium">
                Description
              </label>

              <textarea
                value={form.description ?? ''}
                onChange={(e) =>
                  handleFormChange(
                    'description',
                    e.target.value,
                  )
                }
                rows={3}
                className="mt-1 w-full resize-none rounded-lg border p-2.5 text-sm"
              />
            </div>

            {/* ───────────────────────────── */}
            {/* Basic Business Information */}
            {/* ───────────────────────────── */}

            <div className="grid grid-cols-2 gap-4">

              {/* Location */}
              <div>
                <label className="text-sm font-medium">
                  Location
                </label>

                <input
                  value={form.location ?? ''}
                  onChange={(e) =>
                    handleFormChange(
                      'location',
                      e.target.value,
                    )
                  }
                  className="mt-1 w-full rounded-lg border p-2.5 text-sm"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-sm font-medium">
                  Phone
                </label>

                <input
                  value={form.phone ?? ''}
                  onChange={(e) =>
                    handleFormChange(
                      'phone',
                      e.target.value,
                    )
                  }
                  className="mt-1 w-full rounded-lg border p-2.5 text-sm"
                />
              </div>

              {/* Website */}
              <div>
                <label className="text-sm font-medium">
                  Website
                </label>

                <input
                  value={form.website ?? ''}
                  onChange={(e) =>
                    handleFormChange(
                      'website',
                      e.target.value,
                    )
                  }
                  className="mt-1 w-full rounded-lg border p-2.5 text-sm"
                />
              </div>

              {/* Email */}
              <div>
                <label className="text-sm font-medium">
                  Email
                </label>

                <input
                  value={form.email ?? ''}
                  onChange={(e) =>
                    handleFormChange(
                      'email',
                      e.target.value,
                    )
                  }
                  className="mt-1 w-full rounded-lg border p-2.5 text-sm"
                />
              </div>

              {/* Business Hours */}
              <div>
                <label className="text-sm font-medium">
                  Business hours
                </label>

                <input
                  value={
                    form.businessHours ?? ''
                  }
                  onChange={(e) =>
                    handleFormChange(
                      'businessHours',
                      e.target.value,
                    )
                  }
                  className="mt-1 w-full rounded-lg border p-2.5 text-sm"
                />
              </div>

              {/* Price Range */}
              <div>
                <label className="text-sm font-medium">
                  Price range
                </label>

                <input
                  value={form.priceRange ?? ''}
                  onChange={(e) =>
                    handleFormChange(
                      'priceRange',
                      e.target.value,
                    )
                  }
                  className="mt-1 w-full rounded-lg border p-2.5 text-sm"
                />
              </div>

            </div>

            {/* ───────────────────────────── */}
            {/* Logo */}
            {/* ───────────────────────────── */}

            <div>
              <label className="text-sm font-medium">
                Logo
              </label>

              <div className="mt-2">
                <SingleImageUploader
                  type="ENTITY_LOGO"
                  targetId={entityId}
                  currentUrl={entity.logo}
                  shape="circle"
                  onUploaded={(url) =>
                    setForm((prev) => ({
                      ...prev,
                      logo: url,
                    }))
                  }
                />
              </div>
            </div>

            {/* ───────────────────────────── */}
            {/* Cover Photo */}
            {/* ───────────────────────────── */}

            <div>
              <label className="text-sm font-medium">
                Cover Photo
              </label>

              <div className="mt-2">
                <SingleImageUploader
                  type="ENTITY_COVER"
                  targetId={entityId}
                  currentUrl={entity.coverPhoto}
                  onUploaded={(url) =>
                    setForm((prev) => ({
                      ...prev,
                      coverPhoto: url,
                    }))
                  }
                />
              </div>
            </div>

            {/* ───────────────────────────── */}
            {/* Amenities */}
            {/* ───────────────────────────── */}

            <div>
              <label className="text-sm font-medium">
                Amenities
              </label>

              <input
                value={form.amenities ?? ''}
                onChange={(e) =>
                  handleFormChange(
                    'amenities',
                    e.target.value,
                  )
                }
                placeholder="Wi-Fi, Parking, Wheelchair accessible"
                className="mt-1 w-full rounded-lg border p-2.5 text-sm"
              />
            </div>

            {/* ───────────────────────────── */}
            {/* Payment Methods */}
            {/* ───────────────────────────── */}

            <div>
              <label className="text-sm font-medium">
                Payment methods
              </label>

              <input
                value={
                  form.paymentMethods ?? ''
                }
                onChange={(e) =>
                  handleFormChange(
                    'paymentMethods',
                    e.target.value,
                  )
                }
                placeholder="Cash, Visa, Mastercard, bKash"
                className="mt-1 w-full rounded-lg border p-2.5 text-sm"
              />
            </div>

            {/* ───────────────────────────── */}
            {/* Save */}
            {/* ───────────────────────────── */}

            <button
              type="submit"
              disabled={savingInfo}
              className="rounded-lg bg-black px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
            >
              {savingInfo
                ? 'Saving...'
                : 'Save changes'}
            </button>

          </form>
        )}

      </div>
    </main>
  );
}