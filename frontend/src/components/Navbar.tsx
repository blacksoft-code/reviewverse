'use client';

import Link from 'next/link';

import {
  useAuth,
} from '@/context/AuthContext';



export default function Navbar() {

  // NEW:
  // Global authentication state AuthContext থেকে নিচ্ছি।
  const {
    user,
    loading,
    logout,
  } = useAuth();

  // NEW:
  // Logout করার সময় token এবং global user state
  // দুটোই clear করছি।
  function handleLogout() {
    

    // AuthContext-এর user state clear হবে।
    logout();
  }

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

        <div className="flex items-center gap-5">

          {/* Home */}
          <Link
            href="/"
            className="rounded-lg border bg-black px-4 py-2 text-sm hover:bg-gray-50"
          >
            Home
          </Link>

          {/* Authentication state */}
          {!loading && (
            <>
              {user ? (
                <>
                  {/* Logged-in user */}
                  <a
                    href={`/profile/${user.id}`}
                    className="text-sm text-gray-600"
                  >
                    Hey, {user.name}
                  </a>

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