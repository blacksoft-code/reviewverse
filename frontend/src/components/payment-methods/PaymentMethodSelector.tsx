'use client';

import { useEffect, useState } from 'react';
import {
  PaymentMethod,
  getPaymentMethods,
} from '@/services/payment-method.service';

type PaymentMethodSelectorProps = {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

// AmenitySelector-এর মতোই — master list নিজেই fetch করে, parent শুধু
// selectedIds + onChange দেয়। add-business form, business edit info
// tab — দুই জায়গাতেই reuse হবে।
export default function PaymentMethodSelector({
  selectedIds,
  onChange,
}: PaymentMethodSelectorProps) {
  const [availableMethods, setAvailableMethods] = useState<
    PaymentMethod[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPaymentMethods() {
      try {
        const response = await getPaymentMethods();
        setAvailableMethods(response.data);
      } catch {
        setAvailableMethods([]);
      } finally {
        setLoading(false);
      }
    }

    loadPaymentMethods();
  }, []);

  function toggle(id: string) {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((existing) => existing !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  }

  if (loading) {
    return (
      <p className="mt-1 text-sm text-gray-500">
        Loading payment methods…
      </p>
    );
  }

  if (availableMethods.length === 0) {
    return (
      <p className="mt-1 text-sm text-gray-500">
        No payment methods available yet.
      </p>
    );
  }

  return (
    <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
      {availableMethods.map((method) => (
        <label
          key={method.id}
          className="flex items-center gap-2 rounded-lg border p-2 text-sm"
        >
          <input
            type="checkbox"
            checked={selectedIds.includes(method.id)}
            onChange={() => toggle(method.id)}
          />
          {method.name}
        </label>
      ))}
    </div>
  );
}