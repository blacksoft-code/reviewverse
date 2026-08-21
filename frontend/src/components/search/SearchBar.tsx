'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SearchBar() {
  const router = useRouter();

  const [query, setQuery] = useState('');

  function handleSubmit(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();

    const trimmedQuery = query.trim();

    // NEW:
    // Empty search হলে কোনো request/navigation করব না।
    if (!trimmedQuery) {
      return;
    }

    // NEW:
    // Search page-এ query পাঠাচ্ছি।
    router.push(
      `/search?q=${encodeURIComponent(trimmedQuery)}`,
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex w-full max-w-2xl gap-2"
    >
      <input
        type="search"
        value={query}
        onChange={(event) =>
          setQuery(event.target.value)
        }
        placeholder="Search restaurants, cafes, hotels..."
        className="flex-1 rounded-lg border px-4 py-3 outline-none focus:ring-2"
      />

      <button
        type="submit"
        className="rounded-lg bg-black px-6 py-3 font-medium text-white hover:bg-gray-800"
      >
        Search
      </button>
    </form>
  );
}