'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  loginUser,
  saveAccessToken,
  getProfile,
} from '@/services/auth.service';

import { useAuth } from '@/context/AuthContext';

// Decorative paw (reference design-er paw sticker)
function Paw({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      <ellipse cx="12" cy="27" rx="6" ry="8" />
      <ellipse cx="25" cy="14" rx="6" ry="8" />
      <ellipse cx="41" cy="14" rx="6" ry="8" />
      <ellipse cx="53" cy="27" rx="6" ry="8" />
      <path d="M32 31c-9 0-17 9-15 17 1 6 8 7 15 7s14-1 15-7c2-8-6-17-15-17Z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();

  // AuthContext থেকে global user state update করার function নিচ্ছি।
  const { setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');
    setLoading(true);

    try {
      const response = await loginUser({
        email,
        password,
      });

      // JWT access token localStorage-এ save করছি।
      saveAccessToken(response.data.access_token);

      // Login করার পর backend থেকে current user's profile নিয়ে আসছি।
      const profileResponse = await getProfile();

      // Global AuthContext-এর user update করছি,
      // এর ফলে Navbar refresh ছাড়াই বুঝতে পারবে user login করেছে।
      setUser(profileResponse.data);

      // Home page-এ নিয়ে যাবে।
      router.push('/');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Login failed',
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100 md:items-center md:justify-center md:p-8">
      {/* Soft background blobs */}
      <div className="pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-white/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-20 bottom-10 h-80 w-80 rounded-full bg-pink-200/50 blur-3xl" />

      {/* Floating paw stickers */}
      <Paw className="pointer-events-none absolute right-6 top-8 h-14 w-14 rotate-12 text-white/80 md:right-[22%] md:top-16 md:h-20 md:w-20" />
      <Paw className="pointer-events-none absolute left-8 top-36 h-9 w-9 -rotate-12 text-white/60 md:left-[24%] md:top-40" />

      <div className="relative z-10 flex w-full flex-1 flex-col md:max-w-md md:flex-none">
        {/* Hero (sky area) */}
        <header className="px-6 pb-10 pt-14 md:px-2 md:pb-8 md:pt-0">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-slate-800 shadow-sm backdrop-blur">
            <Paw className="h-4 w-4 text-sky-500" />
            ReviewVerse
          </span>

          <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight text-slate-900 sm:text-6xl">
            Welcome
            <br />
            Back
          </h1>

          <p className="mt-3 max-w-xs text-base text-slate-700">
            Login to your ReviewVerse account
          </p>
        </header>

        {/* Form sheet */}
        <section className="flex-1 rounded-t-[2.5rem] bg-white px-6 pb-10 pt-8 shadow-[0_-12px_40px_-12px_rgba(14,116,144,0.25)] md:flex-none md:rounded-[2.5rem] md:p-10 md:shadow-xl">
          <form
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            {/* Email */}
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Email
              </label>

              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                >
                  <rect x="3" y="5" width="18" height="14" rx="3" />
                  <path d="m4 7 8 6 8-6" />
                </svg>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(event) =>
                    setEmail(event.target.value)
                  }
                  required
                  className="h-14 w-full rounded-full border border-transparent bg-slate-100 pl-12 pr-5 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-slate-800"
              >
                Password
              </label>

              <div className="relative">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                  className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
                >
                  <rect x="4" y="10" width="16" height="10" rx="3" />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>

                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  required
                  className="h-14 w-full rounded-full border border-transparent bg-slate-100 pl-12 pr-20 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:ring-4 focus:ring-sky-100"
                  placeholder="Your password"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-3 py-2 text-sm font-semibold text-sky-600 hover:bg-sky-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-2xl bg-pink-50 px-4 py-3 text-sm font-medium text-pink-700"
              >
                {error}
              </p>
            )}

            {/* Dark pill button with blue circle (like the "Let's Go" button) */}
            <button
              type="submit"
              disabled={loading}
              className="group flex h-16 w-full items-center gap-3 rounded-full bg-slate-900 p-2 pr-6 text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-300 text-slate-900">
                {loading ? (
                  <svg
                    viewBox="0 0 24 24"
                    className="h-5 w-5 animate-spin"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                    aria-hidden="true"
                  >
                    <circle cx="12" cy="12" r="9" opacity="0.25" />
                    <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
                  </svg>
                ) : (
                  <Paw className="h-6 w-6" />
                )}
              </span>

              <span className="flex-1 text-center text-base font-semibold">
                {loading ? 'Logging in...' : 'Login'}
              </span>
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}