'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useAuth } from '@/context/AuthContext';

const CARD =
  'rounded-2xl border border-[#d2d2d7] bg-white p-6 transition hover:border-[#0071e3] hover:shadow-sm';

type AdminSection = {
  href: string;
  title: string;
  description: string;
  emoji: string;
};

const sections: AdminSection[] = [
  {
    href: '/admin/businesses',
    title: 'Businesses',
    description: 'সব business দেখা, manage করা।',
    emoji: '🏢',
  },
  {
    href: '/admin/categories',
    title: 'Categories',
    description: 'Category আর SubCategory manage করা।',
    emoji: '🗂️',
  },
  {
    href: '/admin/claims',
    title: 'Claims',
    description: 'Business ownership claim review করা।',
    emoji: '📋',
  },
  {
    href: '/admin/locations',
    title: 'Locations',
    description: 'Location tree দেখা, rename, move, delete করা।',
    emoji: '📍',
  },
  {
    href: '/admin/amenities',
    title: 'Amenities',
    description: 'Amenity master list manage করা।',
    emoji: '✓',
  },
  {
    href: '/admin/payment-methods',
    title: 'Payment Methods',
    description: 'Payment method master list manage করা।',
    emoji: '💳',
  },
];

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;

    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'ADMIN') {
      router.push('/');
    }
  }, [loading, user, router]);

  if (loading || !user || user.role !== 'ADMIN') {
    return null;
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="mb-1 text-[28px] font-semibold text-[#1d1d1f]">
        Admin
      </h1>
      <p className="mb-8 text-[15px] text-[#86868b]">
        যা manage করতে চাও, বেছে নাও।
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        {sections.map((section) => (
          <Link
            key={section.href}
            href={section.href}
            className={CARD}
          >
            <div className="text-2xl">{section.emoji}</div>
            <h2 className="mt-3 text-[17px] font-semibold text-[#1d1d1f]">
              {section.title}
            </h2>
            <p className="mt-1 text-[14px] text-[#86868b]">
              {section.description}
            </p>
          </Link>
        ))}
      </div>
    </main>
  );
}