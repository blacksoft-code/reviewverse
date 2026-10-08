const API_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_URL) {
  throw new Error('NEXT_PUBLIC_API_URL is not defined');
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('access_token')
      : null;

  // Entity mode-এ থাকলে backend-কে জানানো হয় "আমি এই entity হিসেবে কাজ
  // করছি" — Q&A-তে এটা দিয়েই enforce হয়: entity mode-এ প্রশ্ন করা যাবে
  // না, আর reply শুধু entity mode-এ (ঐ entity-র) দেওয়া যাবে।
  let actingEntityId: string | null = null;

  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('active_business');
      actingEntityId = raw
        ? (JSON.parse(raw)?.business?.id ?? null)
        : null;
    } catch {
      actingEntityId = null;
    }
  }

  console.log('[apiFetch] API_URL:', API_URL);
  console.log('[apiFetch] URL:', `${API_URL}${endpoint}`);    

  const response = await fetch(
    `${API_URL}${endpoint}`,
    {
      ...options,
      headers: {
        'Content-Type': 'application/json',

        ...(token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {}),

        ...(actingEntityId
          ? { 'X-Acting-Entity-Id': actingEntityId }
          : {}),

        ...options.headers,
      },
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message || 'Something went wrong',
    );
  }

  return data;
}