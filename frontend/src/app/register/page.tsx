'use client';

import { FormEvent, useState } from 'react';
import { registerUser } from '@/services/auth.service';

export default function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    setError('');
    setSuccess('');

    try {
      await registerUser({
        name,
        email,
        password,
      });

      setSuccess(
        'Registration successful. You can now login.',
      );

      setName('');
      setEmail('');
      setPassword('');
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : 'Registration failed',
      );
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md">

        <h1 className="text-3xl font-bold">
          Create Account
        </h1>

        <p className="mt-2 text-gray-600">
          Join ReviewVerse
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-8 space-y-5"
        >

          <div>
            <label className="block text-sm font-medium">
              Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              required
              className="mt-1 w-full rounded-lg border p-3"
              placeholder="Your name"
            />
          </div>

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
              minLength={6}
              className="mt-1 w-full rounded-lg border p-3"
              placeholder="Minimum 6 characters"
            />
          </div>

          {error && (
            <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </p>
          )}

          {success && (
            <p className="rounded-lg bg-green-50 p-3 text-sm text-green-600">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="w-full rounded-lg bg-black px-4 py-3 font-medium text-white hover:bg-gray-800"
          >
            Create Account
          </button>

        </form>
      </div>
    </main>
  );
}