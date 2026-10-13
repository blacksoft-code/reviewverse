import type { ReactionType } from '@/services/reaction.service';

// সব জায়গার (review / post / share) reaction-এর নাম, emoji, রং — এক জায়গায়।
// এখানে বদলালে সব জায়গায় বদলে যায়।
export const REACTIONS: {
  type: ReactionType;
  emoji: string;
  label: string;
  color: string;
}[] = [
  {
    type: 'HELPFUL',
    emoji: '👍',
    label: 'Helpful',
    color: 'text-blue-600',
  },
  {
    type: 'LOVE',
    emoji: '❤️',
    label: 'Love',
    color: 'text-red-600',
  },
  {
    type: 'ACCURATE',
    emoji: '🎯',
    label: 'Accurate',
    color: 'text-green-600',
  },
  {
    type: 'HAHA',
    emoji: '😂',
    label: 'Haha',
    color: 'text-yellow-500',
  },
  {
    type: 'DISLIKE',
    emoji: '👎',
    label: 'Dislike',
    color: 'text-gray-600',
  },
];

// কোনো reaction না দিলে main button-এ যা দেখায়
export const DEFAULT_REACTION: ReactionType = 'HELPFUL';

export function getReactionMeta(type: ReactionType | null) {
  return REACTIONS.find((r) => r.type === type) ?? null;
}
