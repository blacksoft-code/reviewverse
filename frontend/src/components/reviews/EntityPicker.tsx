'use client';

import {
  KeyboardEvent,
  useEffect,
  useRef,
  useState,
} from 'react';

import {
  search,
  SearchEntity,
} from '@/services/search.service';

type EntityPickerProps = {
  onSelect: (entity: SearchEntity) => void;
};

const DEBOUNCE_MS = 250;

// Predictive search — টাইপ করার সাথে সাথে business suggest করে।
// শুধু entity দেখায় (user নয়), কারণ review শুধু entity-কেই দেওয়া যায়।
export default function EntityPicker({
  onSelect,
}: EntityPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchEntity[]>(
    [],
  );
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef<HTMLDivElement>(null);

  // দ্রুত টাইপ করলে পুরনো response যেন নতুনটাকে overwrite না করে
  const requestIdRef = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();

    if (trimmed.length < 2) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    const timer = setTimeout(async () => {
      const requestId = ++requestIdRef.current;

      try {
        const response = await search(trimmed);

        if (requestId !== requestIdRef.current) return;

        setResults(response.data.entities ?? []);
        setActiveIndex(-1);
      } catch {
        if (requestId !== requestIdRef.current) return;
        setResults([]);
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false);
        }
      }
    }, DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query]);

  // বাইরে click করলে dropdown বন্ধ
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClick);
    return () =>
      document.removeEventListener(
        'mousedown',
        handleClick,
      );
  }, []);

  function choose(entity: SearchEntity) {
    setOpen(false);
    setQuery('');
    setResults([]);
    onSelect(entity);
  }

  function handleKeyDown(
    e: KeyboardEvent<HTMLInputElement>,
  ) {
    if (!open || results.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex((i) =>
        i + 1 >= results.length ? 0 : i + 1,
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex((i) =>
        i <= 0 ? results.length - 1 : i - 1,
      );
    } else if (e.key === 'Enter' && activeIndex >= 0) {
      e.preventDefault();
      choose(results[activeIndex]);
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  }

  const showDropdown =
    open && query.trim().length >= 2;

  return (
    <div ref={wrapperRef} className="relative">
      <div className="flex items-center gap-2 rounded-xl bg-[#f5f5f7] px-4 py-3 focus-within:ring-2 focus-within:ring-[#0071e3]/40">
        <svg
          viewBox="0 0 20 20"
          className="h-4 w-4 shrink-0 text-[#86868b]"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        >
          <circle cx="9" cy="9" r="6" />
          <path d="m14 14 4 4" />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search a business, place or service"
          autoComplete="off"
          className="w-full bg-transparent text-[15px] text-[#1d1d1f] outline-none placeholder:text-[#86868b]"
        />

        {loading && (
          <span className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-[#d2d2d7] border-t-[#86868b]" />
        )}
      </div>

      {showDropdown && (
        <div className="absolute left-0 right-0 z-20 mt-2 max-h-80 overflow-y-auto rounded-2xl border border-black/5 bg-white p-1.5 shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          {!loading && results.length === 0 && (
            <p className="px-3 py-4 text-center text-sm text-[#86868b]">
              No businesses found
            </p>
          )}

          {results.map((entity, index) => (
            <button
              key={entity.id}
              type="button"
              onClick={() => choose(entity)}
              onMouseEnter={() => setActiveIndex(index)}
              className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                index === activeIndex
                  ? 'bg-[#f5f5f7]'
                  : ''
              }`}
            >
              <span className="min-w-0">
                <span className="block truncate text-[15px] font-medium text-[#1d1d1f]">
                  {entity.name}
                </span>
                <span className="block truncate text-xs text-[#86868b]">
                  {entity.category.name}
                  {entity.location
                    ? ` · ${entity.location}`
                    : ''}
                </span>
              </span>

              <span className="shrink-0 text-xs text-[#86868b]">
                ★ {entity.averageRating}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
