'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

import {
  getProfile,
  removeAccessToken,
} from '@/services/auth.service';

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
};

export default function Navbar() {
  const [user, setUser] = useState<User | null>(null);

  // NEW:
  // Profile check করার সময় loading state রাখছি।
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      try {
        // NEW:
        // Backend থেকে currently logged-in user-এর profile
        // নিয়ে আসছি।
        const response = await getProfile();

        setUser(response.data);
      } catch {
        // Token না থাকলে অথবা invalid হলে
        // user logged out হিসেবে থাকবে।
        setUser(null);
      } finally {
        setLoading(false);
      }
    }

    loadUser();
  }, []);

  // NEW:
  // Logout করলে localStorage থেকে JWT remove হবে।
  function handleLogout() {
    removeAccessToken();

    // Navbar-এর UI থেকেও immediately user remove করছি।
    setUser(null);
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

          {/* Navigation */}
          <Link
            href="/"
            className="rounded-lg bg-black border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Home
          </Link>

          {/* NEW:
              Authentication check শেষ না হওয়া পর্যন্ত
              right-side auth buttons hide থাকবে।
          */}
          {!loading && (
            <>
              {user ? (
                <>
                  {/* Logged-in user */}
                  <span className="text-sm text-gray-600">
                    Hi, {user.name}
                  </span>

                  {/* NEW:
                      Logout button
                  */}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="rounded-lg bg-black border px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  {/* Logged-out user */}
                  <Link
                    href="/login"
                    className="rounded-lg bg-black border px-4 py-2 text-sm hover:bg-gray-50"
                  >
                    Login
                  </Link>

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