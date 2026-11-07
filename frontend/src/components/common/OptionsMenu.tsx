'use client';

import { useEffect, useRef, useState } from 'react';

export type OptionsMenuItem = {
  label: string;
  onClick: () => void;
  // true হলে লাল (Delete-এর মতো)
  danger?: boolean;
};

// ⋮ বোতাম + নিচে নামা menu — Review card আর Share card দুটোই এটা ব্যবহার করে,
// তাই দেখতে ও আচরণে সবসময় এক। বাইরে click বা Esc চাপলে বন্ধ হয়।
export default function OptionsMenu({
  items,
  disabled = false,
  label = 'Options',
}: {
  items: OptionsMenuItem[];
  disabled?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onClick);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        disabled={disabled}
        className="flex h-8 w-8 items-center justify-center rounded-full text-xl leading-none text-gray-500 hover:bg-gray-100 disabled:opacity-50"
      >
        ⋮
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-36 overflow-hidden rounded-lg border bg-white py-1 text-gray-800 shadow-lg"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                item.danger ? 'text-red-600' : ''
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
