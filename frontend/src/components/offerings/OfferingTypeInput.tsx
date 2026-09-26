'use client';

import { useEffect, useRef, useState } from 'react';

import { searchOfferingTypes } from '@/services/offering.service';

type OfferingTypeInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
};

// Offering "type" (যেমন "Biriyani", "Juice") এর জন্য predictive search input।
// LocationPicker-এর মতোই debounce করে backend-এ থাকা distinct type গুলো
// suggest করে — কিন্তু এখানে hierarchy বা আলাদা "নতুন যোগ করো" বাটন নেই,
// কারণ Offering.type একটা plain string column। user নতুন কিছু টাইপ করে
// সরাসরি submit করলেই সেটা নতুন type হিসেবে সেভ হয়ে যায়, এবং পরের বার
// এই search-এই suggestion হিসেবে চলে আসে।
export default function OfferingTypeInput({
  value,
  onChange,
  placeholder = 'Offering type (e.g. Biriyani)',
  required,
  className = 'w-full rounded-lg border p-2.5 text-sm',
}: OfferingTypeInputProps) {
  const [suggestions, setSuggestions] = useState<string[]>(
    [],
  );
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!value.trim()) {
      setSuggestions([]);
      return;
    }

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await searchOfferingTypes(
          value.trim(),
        );
        setSuggestions(response.data);
      } catch {
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [value]);

  // ইনপুট বক্সের বাইরে ক্লিক করলে dropdown বন্ধ হয়ে যাবে
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(
          event.target as Node,
        )
      ) {
        setOpen(false);
      }
    }

    document.addEventListener(
      'mousedown',
      handleClickOutside,
    );
    return () =>
      document.removeEventListener(
        'mousedown',
        handleClickOutside,
      );
  }, []);

  function selectSuggestion(type: string) {
    onChange(type);
    setSuggestions([]);
    setOpen(false);
  }

  const trimmed = value.trim();
  const exactMatch = suggestions.some(
    (s) => s.toLowerCase() === trimmed.toLowerCase(),
  );

  const showDropdown =
    open && trimmed.length > 0 && !loading;

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        required={required}
        className={className}
        autoComplete="off"
      />

      {open && trimmed.length > 0 && loading && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border bg-white p-2.5 text-sm text-gray-400 shadow-lg">
          Searching...
        </div>
      )}

      {showDropdown &&
        (suggestions.length > 0 || !exactMatch) && (
          <div className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border bg-white shadow-lg">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => selectSuggestion(s)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-50"
              >
                {s}
              </button>
            ))}

            {/* exact match না থাকলে জানিয়ে দেওয়া হচ্ছে যে এটা নতুন type
                হিসেবে সেভ হবে — এখানে আলাদা কোনো বাটনে ক্লিক করার দরকার
                নেই, ফর্ম submit করলেই এই value দিয়ে offering তৈরি হবে। */}
            {!exactMatch && (
              <div className="border-t px-3 py-2 text-left text-sm text-blue-600">
                + &quot;{trimmed}&quot; নতুন type হিসেবে যোগ হবে
              </div>
            )}
          </div>
        )}
    </div>
  );
}