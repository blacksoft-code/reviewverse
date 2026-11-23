// Backend-এর base URL।
//
// NEXT_PUBLIC_API_URL সাধারণত http://localhost:3000 থাকে। কিন্তু ফোনে
// ফ্রন্টএন্ড http://192.168.x.x:3001 দিয়ে খুললে "localhost" মানে ফোন নিজেই —
// তাই browser-এ host টা বদলে এখনকার পেজের host বসানো হয়
// (http://192.168.x.x:3000)। Server-side (SSR)-এ কিছু বদলায় না।
function resolveApiUrl(): string {
  const configured =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  if (typeof window === 'undefined') return configured;

  try {
    const url = new URL(configured);
    const local = ['localhost', '127.0.0.1'];

    if (
      local.includes(url.hostname) &&
      !local.includes(window.location.hostname)
    ) {
      url.hostname = window.location.hostname;
      return url.toString().replace(/\/$/, '');
    }
  } catch {
    // configured URL ভুল হলে যেমন আছে তেমন ফেরত যাবে
  }

  return configured;
}

export const API_URL = resolveApiUrl();
