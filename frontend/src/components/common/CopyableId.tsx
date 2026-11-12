'use client';

import { useState } from 'react';

type CopyableIdProps = {
  value: string;
  className?: string;
  // Copy বাটনের style বদলাতে চাইলে (যেমন গাঢ় background-এর উপরে)
  buttonClassName?: string;
};

// ১২ অক্ষরের public ID দেখায়, পাশে Copy বাটন
export default function CopyableId({
  value,
  className = '',
  buttonClassName = 'text-sm font-medium text-blue-400 hover:underline',
}: CopyableIdProps) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard পাওয়া না গেলে কিছু করার নেই — ID টা তো দেখাই যাচ্ছে
    }
  }

  return (
    <span
      className={`inline-flex items-center gap-3 ${className}`}
    >
      <span className="font-mono tracking-widest">
        {value}
      </span>

      <button
        type="button"
        onClick={copy}
        className={buttonClassName}
      >
        {copied ? 'Copied ✓' : 'Copy'}
      </button>
    </span>
  );
}
