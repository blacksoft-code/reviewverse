'use client';

import Link from 'next/link';
import {
  useAuth,
} from '@/context/AuthContext';
import BusinessSwitcher from '@/components/BusinessSwitcher';
import SearchBox from '@/components/search/SearchBox';
import NotificationBell from '@/components/NotificationBell';
import { useBusinessContext } from '@/context/BusinessContext';

export default function Navbar() {

  const {
    user,
    loading,
    logout,
  } = useAuth();

  const { activeBusiness } = useBusinessContext();

  // NEW:
  // Logout করার সময় token এবং global user state
  // দুটোই clear করছি।
  function handleLogout() {
    
    // AuthContext-এর user state clear হবে।
    logout();
  }

  // ─────────────────────────────
  // Entity mode (business profile) — আলাদা navbar:
  // শুধু logo (→ business dashboard), entity-র notification bell,
  // business switcher আর logout। Search/Explore/Admin ইত্যাদি থাকে না।
  // ─────────────────────────────
  if (user && activeBusiness) {
    return (
      <nav className="border-b bg-black">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

          {/* Logo → business dashboard */}
          <Link
            href={`/business/${activeBusiness.id}`}
            className="text-xl font-bold"
          >
            ReviewVerse
          </Link>

          <div className="flex items-center gap-5">

            {/* Entity-র notification (business mode-এর bell) */}
            <NotificationBell />

            {/* Business switcher */}
            <BusinessSwitcher />

            {/* Logout */}
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border bg-black px-4 py-2 text-sm hover:bg-gray-50"
            >
              Logout
            </button>
          </div>
        </div>
      </nav>
    );
  }

  // ─────────────────────────────
  // Personal mode — আগের মতোই, কোনো পরিবর্তন নেই
  // ─────────────────────────────
  return (
    <nav className="border-b bg-black">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">

        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold"
        >
          ReviewVerse
        </Link>

        <SearchBox />

        <div className="flex items-center gap-5">

            {/* Explore (location-based search) */}
          <Link
            href="/explore"
            className="rounded-lg border bg-black px-4 py-2 text-sm hover:bg-gray-50"
          >
            Explore
          </Link>

          {/* Authentication state */}
          {!loading && (
            <>
              {user ? (
                <>

                {/* NEW: My Businesses */}
      

        {/* NEW: Admin-only Claims link */}
        {user.role === 'ADMIN' && (
          <Link
            href="/admin"
            className="rounded-lg border bg-black px-4 py-2 text-sm hover:bg-gray-50"
          >
            Admin
          </Link>
        )}
                  {/* Notifications */}
                  <NotificationBell />

                  {/* Logged-in user */}
                  <BusinessSwitcher />

                  {/* Logout */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg border bg-black px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Logout
                  </button>                 
                </>
              ) : (
                <>
                  {/* Login */}
                  <Link
                    href="/login"
                    className="rounded-lg border bg-black px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Login
                  </Link>

                  {/* Register */}
                  <Link
                    href="/register"
                    className="rounded-lg bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
                  >
                    Register
                  </Link>
                </>
              )}
            </>
          )}

        </div>
      </div>
    </nav>
  );
}