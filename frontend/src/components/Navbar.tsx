'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  useAuth,
} from '@/context/AuthContext';
import BusinessSwitcher from '@/components/BusinessSwitcher';
import SearchBox from '@/components/search/SearchBox';
import NotificationBell from '@/components/NotificationBell';
import { useBusinessContext } from '@/context/BusinessContext';

// উপরে হালকা আকাশি নীল bar — দুই mode-এই একই
const navClass =
  'border-b border-black/5 bg-gradient-to-b from-[#BFE4FA] to-[#DDF1FC] text-[#1d1d1f] shadow-sm';

// সাদা pill বাটন (Explore, Admin, Login)
const pillClass =
  'rounded-full bg-white px-4 py-2 text-sm font-medium text-[#1d1d1f] shadow-sm ring-1 ring-black/[0.04] transition hover:bg-white/70';

export default function Navbar() {

  const {
    user,
    loading,
    logout,
  } = useAuth();

  const { activeBusiness } = useBusinessContext();
  const pathname = usePathname();

  // NEW:
  // Logout করার সময় token এবং global user state
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
      <nav className={navClass}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">

          {/* Logo → business dashboard */}
          <Link
            href={`/business/${activeBusiness.id}`}
            onClick={(e) => {
              // Dashboard-এর ভেতরেই থাকলে (যেমন Business info tab-এ) Next.js
              // একই page ধরে নিয়ে tab রিসেট করে না — তাই fresh load করে
              // default Overview tab-এ ফেরা হয়
              const dashboardPath = `/business/${activeBusiness.id}`;

              if (pathname === dashboardPath) {
                e.preventDefault();
                window.location.href = dashboardPath;
              }
            }}
            className="text-xl font-bold tracking-tight"
          >
            ReviewVerse
          </Link>

          <div className="flex items-center gap-3 sm:gap-5">

            {/* Entity-র notification (business mode-এর bell) */}
            <NotificationBell />

            {/* Business switcher */}
            <BusinessSwitcher />          
          </div>
        </div>
      </nav>
    );
  }

  // ─────────────────────────────
  // Personal mode — আগের মতোই, কোনো পরিবর্তন নেই
  // ─────────────────────────────
  return (
    <nav className={navClass}>
      {/* মোবাইলে দুই লাইন: উপরে logo + বাটন, নিচে search (পুরো চওড়া)।
          বড় screen-এ আগের মতো এক লাইন। */}
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-3 gap-y-3 px-4 py-3 sm:px-6 sm:py-4 md:flex-nowrap">

        {/* Logo */}
        <Link
          href="/"
          className="text-xl font-bold tracking-tight"
        >
          ReviewVerse
        </Link>

        <div className="order-last w-full md:order-none md:mx-6 md:w-auto md:max-w-md md:flex-1">
          <SearchBox />
        </div>

        <div className="flex items-center gap-2 sm:gap-4">

            {/* Explore (location-based search) */}
          <Link
            href="/explore"
            className={pillClass}
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
            className={pillClass}
          >
            Admin
          </Link>
        )}
                  {/* Notifications */}
                  <NotificationBell />

                  {/* Logged-in user */}
                  <BusinessSwitcher />
      
                </>
              ) : (
                <>
                  {/* Login */}
                  <Link
                    href="/login"
                    className={pillClass}
                  >
                    Login
                  </Link>

                  {/* Register */}
                  <Link
                    href="/register"
                    className="rounded-full bg-[#5B9BFF] px-4 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-[#4a8cf5]"
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