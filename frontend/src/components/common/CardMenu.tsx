'use client';

import { useEffect, useRef, useState } from 'react';

export type CardMenuItem = {
  label: string;
  onClick: () => void;
  // true হলে লাল (Delete-এর মতো)
  danger?: boolean;
  disabled?: boolean;
};

// Card-এর উপরের ডান কোণায় "⋯" বাটন — চাপলে Edit / Delete-এর মতো action-এর dropdown।
// বাইরে click করলে বা Esc চাপলে বন্ধ হয়।
export default function CardMenu({
  items,
  disabled = false,
  className = '',
}: {
  items: CardMenuItem[];
  disabled?: boolean;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function onDown(e: MouseEvent) {
      if (!ref.current?.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        aria-label="More options"
        aria-haspopup="menu"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className="flex h-8 w-8 items-center justify-center rounded-full text-lg leading-none text-[#6e6e73] transition hover:bg-black/5 disabled:opacity-50"
      >
        ⋯
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 z-20 mt-1 w-36 overflow-hidden rounded-xl bg-white py-1 text-[#1d1d1f] shadow-lg ring-1 ring-black/10"
        >
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                setOpen(false);
                item.onClick();
              }}
              className={`block w-full px-4 py-2 text-left text-sm hover:bg-black/5 disabled:opacity-50 ${
                item.danger ? 'text-[#d70015]' : ''
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
