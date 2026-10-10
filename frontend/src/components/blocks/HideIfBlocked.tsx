'use client';

import { useBlocks } from '@/hooks/useBlocks';

type HideIfBlockedProps = {
  kind: 'user' | 'entity';
  id: string;
  // list-এর layout (grid / border) অক্ষুণ্ণ রাখতে চাইলে wrapper-এর class
  className?: string;
  children: React.ReactNode;
};

// Server component-এর list-এর প্রতিটা card এটা দিয়ে মুড়ে দিলে, block থাকলে
// (user: দুই দিকেই, entity: আমি block করলে) card-টা আর দেখানো হয় না।
// block overview আসার আগে card layout ধরে রাখে কিন্তু লুকিয়ে রাখে —
// blocked card এক ঝলকের জন্যও যেন না দেখা যায়।
export default function HideIfBlocked({
  kind,
  id,
  className,
  children,
}: HideIfBlockedProps) {
  const { loading, hiddenUserIds, blockedEntityIds } =
    useBlocks();

  const hidden =
    kind === 'user'
      ? hiddenUserIds.has(id)
      : blockedEntityIds.has(id);

  if (hidden) return null;

  return (
    <div
      className={className}
      style={{
        // className না থাকলে wrapper layout-এ কোনো জায়গা নেয় না
        display: className ? undefined : 'contents',
        visibility: loading ? 'hidden' : 'visible',
      }}
    >
      {children}
    </div>
  );
}
