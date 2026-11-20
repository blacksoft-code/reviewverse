// Review / share / feed-এ "কে লিখেছে" দেখানোর জন্য user-এর ছোট select —
// নাম ছাড়াও profile ছবি (USER_PROFILE media) আনে। ছবি না থাকলে media = []।
// Frontend এখান থেকে media[0]?.url নেয় (frontend/src/lib/avatar.ts)।
export const USER_BRIEF_SELECT = {
  id: true,
  name: true,
  media: {
    where: { type: 'USER_PROFILE' as const },
    select: { url: true },
    take: 1,
  },
};
