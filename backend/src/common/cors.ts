// CORS-এ কোন frontend origin গুলো অনুমতি পাবে।
//
// Development-এ ফোন/অন্য কম্পিউটার থেকে http://192.168.x.x:3001 দিয়ে খুললে
// origin আর localhost থাকে না, তাই private network (LAN) IP-ও অনুমতি পায়।
// Production-এ শুধু FRONTEND_URL (কমা দিয়ে একাধিক) — না থাকলে localhost:3001।
const LAN_ORIGIN =
  /^https?:\/\/(localhost|127\.0\.0\.1|10\.\d+\.\d+\.\d+|192\.168\.\d+\.\d+|172\.(1[6-9]|2\d|3[01])\.\d+\.\d+)(:\d+)?$/;

const explicitOrigins = (process.env.FRONTEND_URL ?? '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

export const ALLOWED_ORIGINS: (string | RegExp)[] =
  process.env.NODE_ENV === 'production'
    ? explicitOrigins.length > 0
      ? explicitOrigins
      : ['http://localhost:3001']
    : [LAN_ORIGIN, ...explicitOrigins];
