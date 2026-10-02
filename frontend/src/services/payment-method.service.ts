import { apiFetch } from '@/lib/api';

export type PaymentMethod = {
  id: string;
  name: string;
  createdAt: string;
};

type PaymentMethodsResponse = {
  success: boolean;
  statusCode: number;
  data: PaymentMethod[];
};

type PaymentMethodResponse = {
  success: boolean;
  statusCode: number;
  data: PaymentMethod;
};

// GET /payment-methods — যেকেউ পড়তে পারবে (add-business form, business page)
export async function getPaymentMethods() {
  return apiFetch<PaymentMethodsResponse>('/payment-methods');
}

// ─────────────────────────────
// [Admin] Payment Method CRUD
// ─────────────────────────────

export async function createPaymentMethod(name: string) {
  return apiFetch<PaymentMethodResponse>('/payment-methods', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export async function updatePaymentMethod(
  id: string,
  name: string,
) {
  return apiFetch<PaymentMethodResponse>(
    `/payment-methods/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ name }),
    },
  );
}

export async function deletePaymentMethod(id: string) {
  return apiFetch<{
    success: boolean;
    statusCode: number;
    data: { message: string };
  }>(`/payment-methods/${id}`, {
    method: 'DELETE',
  });
}