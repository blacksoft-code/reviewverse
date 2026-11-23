import { NextRequest } from 'next/server';

// /uploads/... ছবির request backend-এ পাঠিয়ে উত্তর ফেরত দেয়।
// এতে ছবির URL host-independent থাকে — ফোন, অন্য কম্পিউটার, SSR সব জায়গায় চলে।
const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params;

  const upstream = await fetch(
    `${BACKEND_URL}/uploads/${path.map(encodeURIComponent).join('/')}`,
  );

  if (!upstream.ok || !upstream.body) {
    return new Response('Not found', {
      status: upstream.status === 404 ? 404 : 502,
    });
  }

  return new Response(upstream.body, {
    headers: {
      'Content-Type':
        upstream.headers.get('content-type') ??
        'application/octet-stream',
      // ফাইলের নাম UUID, তাই ছবি বদলালে নাম-ও বদলায় — নিরাপদে cache করা যায়
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
}
