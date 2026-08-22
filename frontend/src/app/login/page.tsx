'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  loginUser,
  saveAccessToken,
  getProfile,
} from '@/services/auth.service';

import { useAuth } from '@/context/AuthContext';

export default function LoginPage() {
  const router = useRouter();

  // NEW:
  // AuthContext থেকে global user state update করার function নিচ্ছি।
  const { setUser } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

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
      saveAccessToken(
        response.data.access_token,
      );

      // NEW:
      // Login করার পর backend থেকে current user's
      // profile নিয়ে আসছি।
      const profileResponse = await getProfile();

      // NEW:
      // Global AuthContext-এর user update করছি।
      //
      // এর ফলে Navbar refresh ছাড়াই বুঝতে পারবে
      // যে user login করেছে।
      setUser(profileResponse.data);

      // Home page-এ নিয়ে যাবে।
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
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">

        <h1 className="text-3xl font-bold">
          Welcome Back
        </h1>

        <p className="mt-2 text-gray-600">
          Login to your ReviewVerse account
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >

          <div>
            <label className="block text-sm font-medium">
              Email
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              required
              className="mt-1 w-full rounded-lg border p-3"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Password
            </label>

            <input
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value)
              }
              required
              className="mt-1 w-full rounded-lg border p-3"
              placeholder="Your password"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {loading
              ? 'Logging in...'
              : 'Login'}
          </button>

        </form>

      </div>
    </main>
  );
}