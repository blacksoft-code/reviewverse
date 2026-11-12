'use client';

import { useRef } from 'react';

type EntityCoverProps = {
  src: string;
  alt: string;
  // 0 = ছবির উপরের অংশ দেখায়, 100 = নিচের অংশ
  positionY: number;
  // true হলে drag করে ছবি উপর-নিচ করা যায় (Facebook-এর মতো)
  repositioning: boolean;
  onPositionChange: (y: number) => void;
};

// Cover photo — box-এর মধ্যে ছবি `object-cover` হয়ে বসে, আর উল্লম্ব অবস্থান
// object-position দিয়ে ঠিক হয়। Reposition mode-এ আঙুল/মাউস দিয়ে drag করলে
// ছবি সেই দিকে সরে।
export default function EntityCover({
  src,
  alt,
  positionY,
  repositioning,
  onPositionChange,
}: EntityCoverProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const drag = useRef<{
    startClientY: number;
    startY: number;
    overflow: number;
  } | null>(null);

  // ছবি box-এর চেয়ে উচ্চতায় কত px বড় (এটুকুই উপর-নিচ করা সম্ভব)
  function getOverflow() {
    const box = boxRef.current;
    const img = imgRef.current;

    if (!box || !img || !img.naturalWidth) return 0;

    const boxW = box.clientWidth;
    const boxH = box.clientHeight;

    const scale = Math.max(
      boxW / img.naturalWidth,
      boxH / img.naturalHeight,
    );

    return Math.max(0, img.naturalHeight * scale - boxH);
  }

  function handlePointerDown(
    e: React.PointerEvent<HTMLDivElement>,
  ) {
    if (!repositioning) return;

    e.currentTarget.setPointerCapture(e.pointerId);

    drag.current = {
      startClientY: e.clientY,
      startY: positionY,
      overflow: getOverflow(),
    };
  }

  function handlePointerMove(
    e: React.PointerEvent<HTMLDivElement>,
  ) {
    const d = drag.current;

    if (!d || d.overflow <= 1) return;

    // নিচে টানলে ছবি নিচে নামে, মানে উপরের অংশ বেশি দেখা যায় → position কমে
    const dy = e.clientY - d.startClientY;
    const next = d.startY - (dy / d.overflow) * 100;

    onPositionChange(Math.min(100, Math.max(0, next)));
  }

  function endDrag() {
    drag.current = null;
  }

  return (
    <div
      ref={boxRef}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      className={`absolute inset-0 overflow-hidden rounded-3xl ${
        repositioning
          ? 'cursor-grab touch-none active:cursor-grabbing'
          : ''
      }`}
    >
      <img
        ref={imgRef}
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-full select-none object-cover"
        style={{ objectPosition: `50% ${positionY}%` }}
      />
    </div>
  );
}
