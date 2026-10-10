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
import ReactionButton from '@/components/reviews/ReactionButton';
import CommentSection from '@/components/reviews/CommentSection';
import { Review, getReviewsByEntity } from '@/services/review.service';
import { getEntityFollowersCount } from '@/services/entity.service';
import { getEntityQuestions } from '@/services/entity-question.service';

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
import PostReactionButton from '@/components/entities/posts/PostReactionButton';
import PostCommentSection from '@/components/entities/posts/PostCommentSection';
import LocationPicker from '@/components/locations/LocationPicker';
import AmenitySelector from '@/components/amenities/AmenitySelector';
import PaymentMethodSelector from '@/components/payment-methods/PaymentMethodSelector';
import BusinessHoursEditor from '@/components/business-hours/BusinessHoursEditor';
import EntityQASection from '@/components/entities/qa/EntityQASection';
import OfferingTypeInput from '@/components/offerings/OfferingTypeInput';
import OfferingForm from '@/components/offerings/OfferingForm';
import {
  Offering,
  deleteOffering,
  getOfferingsByEntity,
  updateOffering,
} from '@/services/offering.service';


type Tab =
  | 'overview'
  | 'reviews'
  | 'posts'
  | 'offerings'
  | 'qa'
  | 'info'
  | 'hours';

const TABS: Tab[] = [
  'overview',
  'reviews',
  'posts',
  'offerings',
  'qa',
  'info',
  'hours',
];

export default function BusinessHomePage() {
  const params = useParams();
  const router = useRouter();
  const entityId = params.entityId as string;

  const { user, loading: authLoading } = useAuth();

  const [tab, setTab] = useState<Tab>('overview');

  const [entity, setEntity] =
    useState<EntityDetail | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ───────── Dashboard overview data ─────────

  const [reviews, setReviews] = useState<Review[]>([]);
  const [followersCount, setFollowersCount] = useState(0);
  const [unansweredCount, setUnansweredCount] = useState(0);

  // কোন (user + offering) group-এর পুরনো review গুলো "more..." দিয়ে খোলা আছে
  const [expandedReviewGroups, setExpandedReviewGroups] =
    useState<Set<string>>(new Set());

  function reviewGroupKey(
    userId: string,
    offeringId: string | null,
  ) {
    return `${userId}::${offeringId ?? 'general'}`;
  }

  function toggleReviewGroup(key: string) {
    setExpandedReviewGroups((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

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

  // ───────── Offerings state ─────────

  const [offerings, setOfferings] = useState<Offering[]>(
    [],
  );

  const [editingOfferingId, setEditingOfferingId] =
    useState<string | null>(null);
  const [editingOfferingName, setEditingOfferingName] =
    useState('');
  const [editingOfferingType, setEditingOfferingType] =
    useState('');
  const [editingOfferingPrice, setEditingOfferingPrice] =
    useState('');
  const [
    editingOfferingDescription,
    setEditingOfferingDescription,
  ] = useState('');

  const [actingOnOffering, setActingOnOffering] =
    useState<string | null>(null);

  // ───────── Edit Info state ─────────

  const [form, setForm] = useState<
    Partial<EntityDetail>
  >({});

  const [amenityIds, setAmenityIds] = useState<string[]>(
    [],
  );
  const [paymentMethodIds, setPaymentMethodIds] = useState<
    string[]
  >([]);

  const [savingInfo, setSavingInfo] = useState(false);
  const [infoSaved, setInfoSaved] = useState(false);

  const { setActiveBusiness } = useBusinessContext();
  const [locationId, setLocationId] = useState<
    string | null
  >(null);


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
  // Notification link (?tab=qa&questionId=...) থেকে এলে
  // সরাসরি Q&A tab খুলবে।
  // Active business এখানে আর clear হয় না — page ছাড়লেও
  // entity mode থেকে যায় (শুধু "Switch back"/logout-এ বের হয়)।
  // ─────────────────────────────

  const [focusQuestionId, setFocusQuestionId] = useState<
    string | undefined
  >(undefined);

  useEffect(() => {
    const query = new URLSearchParams(window.location.search);

    const requestedTab = query.get('tab') as Tab | null;

    if (requestedTab && TABS.includes(requestedTab)) {
      setTab(requestedTab);
    }

    setFocusQuestionId(query.get('questionId') ?? undefined);
  }, []);

  // Notification (?tab=posts&postId=...) থেকে এলে ঐ post-এ scroll
  useEffect(() => {
    if (tab !== 'posts' || posts.length === 0) return;

    const targetId = new URLSearchParams(
      window.location.search,
    ).get('postId');

    if (!targetId) return;

    const el = document.getElementById(`post-${targetId}`);

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-[#0071e3]');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[#0071e3]');
      }, 2000);
    }
  }, [tab, posts]);

  // Notification (?tab=reviews&reviewId=...) থেকে এলে ঐ review-তে scroll
  useEffect(() => {
    if (tab !== 'reviews' || reviews.length === 0) return;

    const targetId = new URLSearchParams(
      window.location.search,
    ).get('reviewId');

    if (!targetId) return;

    const el = document.getElementById(`review-${targetId}`);

    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-[#0071e3]');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[#0071e3]');
      }, 2000);
    }
  }, [tab, reviews]);

  // ─────────────────────────────
  // Load business + posts
  // ─────────────────────────────

  async function loadAll() {
    try {
      setLoading(true);

      const [
        entityRes,
        postsRes,
        offeringsRes,
        reviewsRes,
        followersRes,
        questionsRes,
      ] = await Promise.all([
        getEntityById(entityId),
        getManageFeed(entityId),
        getOfferingsByEntity(entityId),
        // overview-এর অতিরিক্ত data — fail করলে dashboard ভাঙবে না
        getReviewsByEntity(entityId).catch(() => null),
        getEntityFollowersCount(entityId).catch(() => null),
        getEntityQuestions(entityId).catch(() => null),
      ]);

      setEntity(entityRes.data);
      setForm(entityRes.data);

      setAmenityIds(
        entityRes.data.amenities?.map((a) => a.id) ?? [],
      );
      setPaymentMethodIds(
        entityRes.data.paymentMethods?.map((p) => p.id) ??
          [],
      );

      // Navbar-কে জানাচ্ছি কোন business active
      setActiveBusiness({
        id: entityRes.data.id,
        name: entityRes.data.name,
        logo: entityRes.data.logo,
      });

      setPosts(postsRes.data);
      setOfferings(offeringsRes.data);

      setReviews(reviewsRes?.data ?? []);
      setFollowersCount(followersRes?.data ?? 0);
      setUnansweredCount(
        (questionsRes?.data ?? []).filter((q) => !q.answer)
          .length,
      );

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
  // Edit Offering
  // ─────────────────────────────

  function startEditingOffering(offering: Offering) {
    setEditingOfferingId(offering.id);
    setEditingOfferingName(offering.name);
    setEditingOfferingType(offering.type);
    setEditingOfferingPrice(String(offering.price));
    setEditingOfferingDescription(
      offering.description ?? '',
    );
  }

  function cancelEditingOffering() {
    setEditingOfferingId(null);
    setEditingOfferingName('');
    setEditingOfferingType('');
    setEditingOfferingPrice('');
    setEditingOfferingDescription('');
  }

  async function handleUpdateOffering(
    offeringId: string,
  ) {
    setActingOnOffering(offeringId);
    setError('');

    try {
      const response = await updateOffering(offeringId, {
        name: editingOfferingName,
        type: editingOfferingType,
        price: Number(editingOfferingPrice),
        description:
          editingOfferingDescription || undefined,
      });

      setOfferings((prev) =>
        prev.map((o) =>
          o.id === offeringId ? response.data : o,
        ),
      );

      cancelEditingOffering();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to update offering',
      );
    } finally {
      setActingOnOffering(null);
    }
  }

  // ─────────────────────────────
  // Delete Offering
  // ─────────────────────────────

  async function handleDeleteOffering(
    offeringId: string,
  ) {
    setActingOnOffering(offeringId);
    setError('');

    try {
      await deleteOffering(offeringId);

      setOfferings((prev) =>
        prev.filter((o) => o.id !== offeringId),
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to delete offering',
      );
    } finally {
      setActingOnOffering(null);
    }
  }

  // ─────────────────────────────
  // Edit Business Info
  // ─────────────────────────────

  function handleFormChange(
    field: keyof EntityDetail,
    value: string | null,
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

          locationId:
            form.locationId ?? undefined,
  
          phone:
            form.phone ?? undefined,

          website:
            form.website || undefined,

          email:
            form.email ?? undefined,

          priceRange:
            form.priceRange ?? undefined,

          serviceOptions:
            form.serviceOptions ?? undefined,

          coverPhoto:
            form.coverPhoto || undefined,

          logo:
            form.logo || undefined,

          amenityIds,
          paymentMethodIds,

          socialLinks:
            form.socialLinks ?? undefined,

          menu:
            form.menu || undefined,
        },
      );

      setEntity(response.data);
      setForm(response.data);
      setAmenityIds(
        response.data.amenities?.map((a) => a.id) ?? [],
      );
      setPaymentMethodIds(
        response.data.paymentMethods?.map((p) => p.id) ??
          [],
      );
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
      <main className="apple-ui flex min-h-screen items-center justify-center">
        <p className="text-[15px] text-[#6e6e73]">Loading your dashboard…</p>
      </main>
    );
  }

  // ─────────────────────────────
  // Business not found
  // ─────────────────────────────

  if (!entity) {
    return (
      <main className="apple-ui min-h-screen p-8">
        <p className="text-sm text-[#d70015]">
          {error || 'Business not found.'}
        </p>
      </main>
    );
  }

  // ───────── Derived dashboard numbers ─────────

  const latestReviews = reviews.filter((r) => r.isLatest);

  const ratingCounts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: latestReviews.filter(
      (r) => Math.round(r.rating) === star,
    ).length,
  }));

  const maxRatingCount = Math.max(
    1,
    ...ratingCounts.map((r) => r.count),
  );

  const navItems: {
    key: Tab;
    label: string;
    icon: IconName;
    badge?: number;
  }[] = [
    { key: 'overview', label: 'Overview', icon: 'overview' },
    {
      key: 'reviews',
      label: 'Reviews',
      icon: 'reviews',
      badge: latestReviews.length,
    },
    { key: 'posts', label: 'Posts', icon: 'posts' },
    { key: 'offerings', label: 'Services', icon: 'services' },
    {
      key: 'qa',
      label: 'Q&A',
      icon: 'qa',
      badge: unansweredCount,
    },
    { key: 'info', label: 'Business info', icon: 'info' },
    { key: 'hours', label: 'Hours', icon: 'hours' },
  ];

  const titles: Record<Tab, { title: string; sub: string }> = {
    overview: {
      title: 'Overview',
      sub: `How ${entity.name} is doing today.`,
    },
    reviews: {
      title: 'Reviews',
      sub: `React and reply as ${entity.name}.`,
    },
    posts: {
      title: 'Posts',
      sub: 'Share updates with the people who follow you.',
    },
    offerings: {
      title: 'Services',
      sub: 'The products and services you offer.',
    },
    qa: {
      title: 'Questions & Answers',
      sub: 'Answer what customers are asking.',
    },
    info: {
      title: 'Business info',
      sub: 'Keep your details accurate and up to date.',
    },
    hours: {
      title: 'Business hours',
      sub: 'Let customers know when you are open.',
    },
  };

  return (
    <main className="apple-ui min-h-screen pb-20">

      {/* ───────────────────────────── */}
      {/* Top bar (frosted glass) */}
      {/* ───────────────────────────── */}

      <header className="sticky top-0 z-30 border-b border-black/5 bg-[#f5f5f7]/80 backdrop-blur-xl backdrop-saturate-150">
        <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-6">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-[10px] bg-white text-sm font-semibold text-[#6e6e73] ring-1 ring-black/5">
            {entity.logo ? (
              <img
                src={entity.logo}
                alt={entity.name}
                className="h-full w-full object-cover"
              />
            ) : (
              entity.name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="min-w-0 flex-1">
            <p className="truncate text-[15px] font-semibold leading-tight">
              {entity.name}
            </p>
            <p className="text-xs leading-tight text-[#6e6e73]">
              Business Dashboard
            </p>
          </div>

          <Link
            href="/my-businesses"
            className="hidden text-sm text-[#0066cc] hover:underline sm:block"
          >
            All businesses
          </Link>

          <Link
            href={`/entities/${entity.slug}`}
            className={ui.btnGhost}
          >
            View public page
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-8 lg:grid lg:grid-cols-[210px_minmax(0,1fr)] lg:gap-10">

        {/* ───────────────────────────── */}
        {/* Sidebar / pill nav */}
        {/* ───────────────────────────── */}

        <nav className="mb-6 flex gap-1.5 overflow-x-auto pb-1 lg:sticky lg:top-24 lg:mb-0 lg:flex-col lg:self-start lg:overflow-visible">
          {navItems.map((item) => {
            const active = tab === item.key;

            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`flex shrink-0 items-center gap-2.5 rounded-xl px-3.5 py-2 text-left text-[15px] transition ${
                  active
                    ? 'bg-white font-semibold text-[#1d1d1f] shadow-sm ring-1 ring-black/5'
                    : 'text-[#424245] hover:bg-black/5'
                }`}
              >
                <Icon
                  name={item.icon}
                  className={`h-[18px] w-[18px] ${
                    active ? 'text-[#0071e3]' : 'text-[#86868b]'
                  }`}
                />

                <span className="flex-1">{item.label}</span>

                {!!item.badge && (
                  <span
                    className={`rounded-full px-1.5 text-xs font-medium ${
                      item.key === 'qa'
                        ? 'bg-[#ff3b30] text-white'
                        : 'bg-black/5 text-[#6e6e73]'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* ───────────────────────────── */}
        {/* Content */}
        {/* ───────────────────────────── */}

        <section className="min-w-0">

          <h1 className="text-[34px] font-semibold leading-tight tracking-tight">
            {titles[tab].title}
          </h1>
          <p className="mt-1 text-[17px] text-[#6e6e73]">
            {titles[tab].sub}
          </p>

          {error && (
            <p className="mt-5 rounded-2xl bg-[#ff3b30]/10 p-4 text-sm text-[#d70015]">
              {error}
            </p>
          )}

          {/* ================================================= */}
          {/* OVERVIEW */}
          {/* ================================================= */}

          {tab === 'overview' && (
            <div className="mt-8 space-y-5">

              {/* Stat cards */}
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatCard
                  label="Rating"
                  value={
                    latestReviews.length > 0
                      ? entity.averageRating.toFixed(1)
                      : '—'
                  }
                  suffix={latestReviews.length > 0 ? '★' : ''}
                />
                <StatCard
                  label="Reviews"
                  value={String(latestReviews.length)}
                  onClick={() => setTab('reviews')}
                />
                <StatCard
                  label="Followers"
                  value={String(followersCount)}
                />
                <StatCard
                  label="Open questions"
                  value={String(unansweredCount)}
                  highlight={unansweredCount > 0}
                  onClick={() => setTab('qa')}
                />
              </div>

              <div className="grid gap-5 lg:grid-cols-2">

                {/* Rating breakdown */}
                <div className={ui.card}>
                  <h2 className="text-[19px] font-semibold">
                    Rating breakdown
                  </h2>

                  <div className="mt-4 space-y-2.5">
                    {ratingCounts.map(({ star, count }) => (
                      <div
                        key={star}
                        className="flex items-center gap-3 text-sm"
                      >
                        <span className="w-6 text-[#6e6e73]">
                          {star}★
                        </span>
                        <div className="h-2 flex-1 overflow-hidden rounded-full bg-[#f5f5f7]">
                          <div
                            className="h-full rounded-full bg-[#ff9f0a]"
                            style={{
                              width: `${(count / maxRatingCount) * 100}%`,
                            }}
                          />
                        </div>
                        <span className="w-6 text-right text-[#6e6e73]">
                          {count}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Quick actions */}
                <div className={ui.card}>
                  <h2 className="text-[19px] font-semibold">
                    Quick actions
                  </h2>

                  <div className="mt-4 grid gap-2.5">
                    <QuickAction
                      label="Write a new post"
                      onClick={() => setTab('posts')}
                    />
                    <QuickAction
                      label="Add a service"
                      onClick={() => setTab('offerings')}
                    />
                    <QuickAction
                      label="Answer questions"
                      onClick={() => setTab('qa')}
                    />
                    <QuickAction
                      label="Edit business info"
                      onClick={() => setTab('info')}
                    />
                  </div>
                </div>
              </div>

              {/* Recent reviews */}
              <div className={ui.card}>
                <div className="flex items-center justify-between">
                  <h2 className="text-[19px] font-semibold">
                    Recent reviews
                  </h2>

                  {latestReviews.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setTab('reviews')}
                      className="text-sm text-[#0066cc] hover:underline"
                    >
                      See all
                    </button>
                  )}
                </div>

                {latestReviews.length === 0 ? (
                  <p className="mt-4 text-[15px] text-[#6e6e73]">
                    No reviews yet. They will show up here as
                    soon as customers start reviewing.
                  </p>
                ) : (
                  <div className="mt-2 divide-y divide-black/5">
                    {latestReviews.slice(0, 3).map((review) => (
                      <div key={review.id} className="py-4">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[15px] font-medium">
                            {review.user?.name ?? 'Customer'}
                          </p>
                          <Stars value={review.rating} />
                        </div>
                        <p className="mt-1 line-clamp-2 text-[15px] text-[#424245]">
                          {review.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ================================================= */}
          {/* REVIEWS — reaction/comment business-এর নামে যায় */}
          {/* ================================================= */}

          {tab === 'reviews' && (
            <div className="mt-8 space-y-5">
              {latestReviews.length === 0 ? (
                <div className={`${ui.card} text-center`}>
                  <p className="text-[17px] font-medium">
                    No reviews yet
                  </p>
                  <p className="mt-1 text-[15px] text-[#6e6e73]">
                    When customers review {entity.name} you can
                    react and reply here.
                  </p>
                </div>
              ) : (
                latestReviews.map((review) => {
                  const groupKey = reviewGroupKey(
                    review.userId,
                    review.offeringId,
                  );

                  // একই user + offering-এর পুরনো (এখন গণনায় নেই) review গুলো
                  const olderReviews = reviews
                    .filter(
                      (r) =>
                        !r.isLatest &&
                        r.userId === review.userId &&
                        r.offeringId === review.offeringId,
                    )
                    .sort(
                      (a, b) =>
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime(),
                    );

                  const isExpanded =
                    expandedReviewGroups.has(groupKey);

                  return (
                  <article
                    key={review.id}
                    id={`review-${review.id}`}
                    className={`${ui.card} transition-shadow`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f5f7] text-sm font-semibold text-[#6e6e73]">
                          {(review.user?.name ?? 'C')
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p className="text-[15px] font-semibold">
                            {review.user?.name ?? 'Customer'}
                          </p>
                          <p className="text-xs text-[#86868b]">
                            {new Date(
                              review.createdAt,
                            ).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <Stars value={review.rating} />
                    </div>

                    {review.offering && (
                      <span className="mt-3 inline-block rounded-full bg-[#f5f5f7] px-3 py-1 text-xs font-medium text-[#6e6e73]">
                        {review.offering.name}
                      </span>
                    )}

                    <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-[#1d1d1f]">
                      {review.content}
                    </p>

                    {review.media && review.media.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {review.media.map((m) => (
                          <img
                            key={m.id}
                            src={m.url}
                            alt=""
                            className="h-24 w-24 rounded-2xl object-cover"
                          />
                        ))}
                      </div>
                    )}

                    <div className="mt-4 border-t border-black/5 pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <ReactionButton reviewId={review.id} />

                        {olderReviews.length > 0 && (
                          <button
                            type="button"
                            onClick={() => toggleReviewGroup(groupKey)}
                            className="text-sm font-medium text-[#0066cc] hover:underline"
                          >
                            {isExpanded
                              ? 'Hide older reviews'
                              : `more... (${olderReviews.length})`}
                          </button>
                        )}
                      </div>

                      {isExpanded && olderReviews.length > 0 && (
                        <div className="mt-4 space-y-3">
                          {olderReviews.map((old) => (
                            <div
                              key={old.id}
                              className="rounded-2xl bg-[#f5f5f7] p-4"
                            >
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-[#86868b]">
                                  পুরনো — এখন গণনায় নেই
                                </span>
                                <Stars value={old.rating} />
                              </div>

                              <p className="mt-2 text-[15px] text-[#424245]">
                                {old.content}
                              </p>

                              <p className="mt-1 text-xs text-[#86868b]">
                                {new Date(
                                  old.createdAt,
                                ).toLocaleDateString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      <CommentSection
                        reviewId={review.id}
                        reviewEntityId={entityId}
                      />
                    </div>
                  </article>
                  );
                })
              )}
            </div>
          )}

          {/* ================================================= */}
          {/* POSTS */}
          {/* ================================================= */}

          {tab === 'posts' && (
            <div className="mt-8 space-y-5">

              <form onSubmit={handleCreate} className={ui.card}>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="What's new with your business?"
                  required
                  rows={3}
                  className={`${ui.input} resize-none`}
                />

                <div className="mt-3">
                  <MultiImageUploader
                    maxFiles={10}
                    onChange={setPostPhotos}
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className={`mt-4 ${ui.btn}`}
                >
                  {submitting ? 'Posting…' : 'Post'}
                </button>
              </form>

              {posts.length === 0 ? (
                <p className="text-[15px] text-[#6e6e73]">
                  No posts yet — publish your first update above.
                </p>
              ) : (
                posts.map((post) =>
                  editingPostId === post.id ? (
                    <div key={post.id} className={ui.card}>
                      <textarea
                        value={editingContent}
                        onChange={(e) =>
                          setEditingContent(e.target.value)
                        }
                        rows={3}
                        className={`${ui.input} resize-none`}
                      />

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdatePost(post.id)}
                          disabled={actingOn === post.id}
                          className={ui.btn}
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditing}
                          className={ui.btnGhost}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div
                      key={post.id}
                      id={`post-${post.id}`}
                      className={`${ui.card} !p-0 overflow-hidden transition-shadow`}
                    >
                      <PostCard
                        name={entity.name}
                        logo={entity.logo}
                        content={post.content}
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
                              onClick={() => startEditing(post)}
                              className={ui.btnGhostSm}
                            >
                              Edit
                            </button>

                            <button
                              type="button"
                              onClick={() => handleDeletePost(post.id)}
                              disabled={actingOn === post.id}
                              className={ui.btnDangerSm}
                            >
                              {actingOn === post.id ? '…' : 'Delete'}
                            </button>
                          </>
                        }
                      />
                      <div className="px-5 pb-4">
                        <PostReactionButton postId={post.id} />
                        <PostCommentSection postId={post.id} />
                      </div>
                    </div>
                  ),
                )
              )}
            </div>
          )}

          {/* ================================================= */}
          {/* SERVICES (offerings) */}
          {/* ================================================= */}

          {tab === 'offerings' && (
            <div className="mt-8 space-y-5">

              <OfferingForm
                entityId={entityId}
                onCreated={(offering) =>
                  setOfferings((prev) => [offering, ...prev])
                }
                wrapperClassName="space-y-3 rounded-3xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-black/5"
                submitButtonClassName={ui.btn}
              />

              {offerings.length === 0 ? (
                <p className="text-[15px] text-[#6e6e73]">
                  No services yet — add your first one above.
                </p>
              ) : (
                offerings.map((offering) =>
                  editingOfferingId === offering.id ? (
                    <div key={offering.id} className={`${ui.card} space-y-3`}>
                      <SingleImageUploader
                        type="OFFERING"
                        targetId={offering.id}
                        currentUrl={offering.media[0]?.url ?? null}
                        shape="rectangle"
                        onUploaded={(url) =>
                          setOfferings((prev) =>
                            prev.map((o) =>
                              o.id === offering.id
                                ? {
                                    ...o,
                                    media: [{ id: 'temp', url }],
                                  }
                                : o,
                            ),
                          )
                        }
                      />

                      <input
                        type="text"
                        value={editingOfferingName}
                        onChange={(e) =>
                          setEditingOfferingName(e.target.value)
                        }
                        className={ui.input}
                      />

                      <OfferingTypeInput
                        value={editingOfferingType}
                        onChange={setEditingOfferingType}
                      />

                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editingOfferingPrice}
                        onChange={(e) =>
                          setEditingOfferingPrice(e.target.value)
                        }
                        className={ui.input}
                      />

                      <textarea
                        value={editingOfferingDescription}
                        onChange={(e) =>
                          setEditingOfferingDescription(e.target.value)
                        }
                        rows={3}
                        className={`${ui.input} resize-none`}
                      />

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleUpdateOffering(offering.id)}
                          disabled={actingOnOffering === offering.id}
                          className={ui.btn}
                        >
                          Save
                        </button>

                        <button
                          type="button"
                          onClick={cancelEditingOffering}
                          className={ui.btnGhost}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div key={offering.id} className={ui.card}>
                      <div className="flex items-start gap-4">
                        {offering.media[0]?.url && (
                          <img
                            src={offering.media[0].url}
                            alt={offering.name}
                            className="h-20 w-20 shrink-0 rounded-2xl object-cover"
                          />
                        )}

                        <div className="flex-1">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <h3 className="text-[17px] font-semibold">
                                {offering.name}
                              </h3>
                              <span className="text-xs text-[#86868b]">
                                {offering.type}
                              </span>
                            </div>

                            <span className="whitespace-nowrap text-[17px] font-semibold">
                              ৳{offering.price}
                            </span>
                          </div>

                          {offering.description && (
                            <p className="mt-3 whitespace-pre-line text-[15px] text-[#6e6e73]">
                              {offering.description}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => startEditingOffering(offering)}
                          className={ui.btnGhostSm}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteOffering(offering.id)}
                          disabled={actingOnOffering === offering.id}
                          className={ui.btnDangerSm}
                        >
                          {actingOnOffering === offering.id ? '…' : 'Delete'}
                        </button>
                      </div>
                    </div>
                  ),
                )
              )}
            </div>
          )}

          {/* ================================================= */}
          {/* Q&A — reply শুধু business profile (এই dashboard) থেকে */}
          {/* ================================================= */}

          {tab === 'qa' && (
            <div className={`mt-8 ${ui.card}`}>
              <EntityQASection
                entityId={entityId}
                entityName={entity.name}
                variant="manage"
                theme="light"
                focusQuestionId={focusQuestionId}
              />
            </div>
          )}

          {/* ================================================= */}
          {/* BUSINESS INFO (edit) */}
          {/* ================================================= */}

          {tab === 'info' && (
            <form onSubmit={handleSaveInfo} className="mt-8 space-y-5">

              {infoSaved && (
                <p className="rounded-2xl bg-[#34c759]/12 p-4 text-sm font-medium text-[#1d7a37]">
                  Business info updated successfully.
                </p>
              )}

              {/* Basics */}
              <div className={`${ui.card} space-y-4`}>
                <h2 className="text-[19px] font-semibold">Basics</h2>

                <div>
                  <label className={ui.label}>Business name</label>
                  <input
                    value={form.name ?? ''}
                    onChange={(e) => handleFormChange('name', e.target.value)}
                    className={ui.input}
                  />
                </div>

                <div>
                  <label className={ui.label}>Description</label>
                  <textarea
                    value={form.description ?? ''}
                    onChange={(e) =>
                      handleFormChange('description', e.target.value)
                    }
                    rows={3}
                    className={`${ui.input} resize-none`}
                  />
                </div>

                <div>
                  <label className={ui.label}>Price range</label>
                  <input
                    value={form.priceRange ?? ''}
                    onChange={(e) =>
                      handleFormChange('priceRange', e.target.value)
                    }
                    className={ui.input}
                  />
                </div>
              </div>

              {/* Contact & location */}
              <div className={`${ui.card} space-y-4`}>
                <h2 className="text-[19px] font-semibold">
                  Contact & location
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={ui.label}>Phone</label>
                    <input
                      value={form.phone ?? ''}
                      onChange={(e) =>
                        handleFormChange('phone', e.target.value)
                      }
                      className={ui.input}
                    />
                  </div>

                  <div>
                    <label className={ui.label}>Email</label>
                    <input
                      value={form.email ?? ''}
                      onChange={(e) =>
                        handleFormChange('email', e.target.value)
                      }
                      className={ui.input}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={ui.label}>Website</label>
                    <input
                      value={form.website ?? ''}
                      onChange={(e) =>
                        handleFormChange('website', e.target.value)
                      }
                      className={ui.input}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className={ui.label}>Address</label>
                    <input
                      value={form.location ?? ''}
                      onChange={(e) =>
                        handleFormChange('location', e.target.value)
                      }
                      className={ui.input}
                    />
                  </div>
                </div>

                <LocationPicker
                  initialLocationId={form.locationId}
                  onChange={(id) => handleFormChange('locationId', id)}
                />
              </div>

              {/* Branding */}
              <div className={`${ui.card} space-y-5`}>
                <h2 className="text-[19px] font-semibold">Branding</h2>

                <div>
                  <label className={ui.label}>Logo</label>
                  <div className="mt-2">
                    <SingleImageUploader
                      type="ENTITY_LOGO"
                      targetId={entityId}
                      currentUrl={entity.logo}
                      shape="circle"
                      onUploaded={(url) =>
                        setForm((prev) => ({ ...prev, logo: url }))
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className={ui.label}>Cover photo</label>
                  <div className="mt-2">
                    <SingleImageUploader
                      type="ENTITY_COVER"
                      targetId={entityId}
                      currentUrl={entity.coverPhoto}
                      onUploaded={(url) =>
                        setForm((prev) => ({ ...prev, coverPhoto: url }))
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Amenities & payments */}
              <div className={`${ui.card} space-y-5`}>
                <h2 className="text-[19px] font-semibold">
                  Amenities & payments
                </h2>

                <div>
                  <label className={ui.label}>Amenities</label>
                  <AmenitySelector
                    selectedIds={amenityIds}
                    onChange={setAmenityIds}
                  />
                </div>

                <div>
                  <label className={ui.label}>Payment methods</label>
                  <PaymentMethodSelector
                    selectedIds={paymentMethodIds}
                    onChange={setPaymentMethodIds}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={savingInfo}
                className={ui.btn}
              >
                {savingInfo ? 'Saving…' : 'Save changes'}
              </button>
            </form>
          )}

          {/* ================================================= */}
          {/* BUSINESS HOURS */}
          {/* ================================================= */}

          {tab === 'hours' && entityId && (
            <div className={`mt-8 ${ui.card}`}>
              <BusinessHoursEditor entityId={entityId} />
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

// ─────────────────────────────────────────────
// Small Apple-style building blocks
// ─────────────────────────────────────────────

const ui = {
  card: 'rounded-3xl bg-white p-6 shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-black/5',
  input:
    'mt-1.5 w-full rounded-xl border border-[#d2d2d7] bg-white px-3.5 py-2.5 text-[15px] text-[#1d1d1f] placeholder-[#86868b] outline-none transition focus:border-[#0071e3] focus:ring-4 focus:ring-[#0071e3]/15',
  label: 'text-[13px] font-medium text-[#6e6e73]',
  btn: 'rounded-full bg-[#0071e3] px-5 py-2.5 text-sm font-medium text-white transition hover:bg-[#0077ed] disabled:opacity-50',
  btnGhost:
    'rounded-full bg-[#e8e8ed] px-4 py-2 text-sm font-medium text-[#1d1d1f] transition hover:bg-[#dcdce1] disabled:opacity-50',
  btnGhostSm:
    'rounded-full bg-[#e8e8ed] px-3.5 py-1.5 text-xs font-medium text-[#1d1d1f] transition hover:bg-[#dcdce1] disabled:opacity-50',
  btnDangerSm:
    'rounded-full bg-[#ff3b30]/10 px-3.5 py-1.5 text-xs font-medium text-[#d70015] transition hover:bg-[#ff3b30]/15 disabled:opacity-50',
};

type IconName =
  | 'overview'
  | 'reviews'
  | 'posts'
  | 'services'
  | 'qa'
  | 'info'
  | 'hours';

const ICON_PATHS: Record<IconName, string> = {
  overview: 'M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z',
  reviews:
    'M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.6l1-5.8L3.5 9.7l5.9-.9z',
  posts: 'M4 5h16v11H9l-5 4z',
  services: 'M3 12l9-9h8v8l-9 9zM15.5 8.5h.01',
  qa: 'M12 21a9 9 0 100-18 9 9 0 000 18zM9.5 9.5a2.5 2.5 0 115 0c0 1.7-2.5 2-2.5 3.5M12 17h.01',
  info: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 11v5M12 8h.01',
  hours: 'M12 21a9 9 0 100-18 9 9 0 000 18zM12 7v5l3 2',
};

function Icon({
  name,
  className,
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ICON_PATHS[name]} />
    </svg>
  );
}

function Stars({ value }: { value: number }) {
  const full = Math.round(value);

  return (
    <span
      className="whitespace-nowrap text-[15px] tracking-tight"
      aria-label={`${value} out of 5`}
    >
      <span className="text-[#ff9f0a]">{'★'.repeat(full)}</span>
      <span className="text-[#d2d2d7]">{'★'.repeat(5 - full)}</span>
    </span>
  );
}

function StatCard({
  label,
  value,
  suffix,
  highlight,
  onClick,
}: {
  label: string;
  value: string;
  suffix?: string;
  highlight?: boolean;
  onClick?: () => void;
}) {
  const Tag = onClick ? 'button' : 'div';

  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={`rounded-3xl bg-white p-5 text-left shadow-[0_1px_3px_rgba(0,0,0,0.04)] ring-1 ring-black/5 ${
        onClick ? 'transition hover:shadow-md' : ''
      }`}
    >
      <p className="text-[13px] font-medium text-[#6e6e73]">{label}</p>
      <p
        className={`mt-2 text-[34px] font-semibold leading-none tracking-tight ${
          highlight ? 'text-[#ff3b30]' : 'text-[#1d1d1f]'
        }`}
      >
        {value}
        {suffix && (
          <span className="ml-1 text-[22px] text-[#ff9f0a]">
            {suffix}
          </span>
        )}
      </p>
    </Tag>
  );
}

function QuickAction({
  label,
  onClick,
}: {
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center justify-between rounded-2xl bg-[#f5f5f7] px-4 py-3 text-left text-[15px] font-medium text-[#1d1d1f] transition hover:bg-[#ececf0]"
    >
      {label}
      <span className="text-[#86868b]">›</span>
    </button>
  );
}
