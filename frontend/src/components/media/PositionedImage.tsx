'use client';

import { useRef } from 'react';

export type ImagePosition = { x: number; y: number };

type PositionedImageProps = {
  src: string;
  alt: string;
  // object-position (%) — 50/50 = মাঝখান
  x?: number;
  y?: number;
  // 'y' = শুধু উপর-নিচ (cover), 'both' = সব দিকে (profile picture)
  axis?: 'y' | 'both';
  // true হলে drag করে ছবি সরানো যায়
  draggable?: boolean;
  onChange?: (position: ImagePosition) => void;
};

// Parent box-কে ভরে দেয় (h-full w-full)। ছবি box-এর চেয়ে বড় অংশ যেদিকে বেশি,
// সেদিকে drag করে "কোন অংশ দেখাবে" ঠিক করা যায় — Facebook-এর reposition-এর মতো।
export default function PositionedImage({
  src,
  alt,
  x = 50,
  y = 50,
  axis = 'y',
  draggable = false,
  onChange,
}: PositionedImageProps) {
  const boxRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  const drag = useRef<{
    startClientX: number;
    startClientY: number;
    startX: number;
    startY: number;
    overflowX: number;
    overflowY: number;
  } | null>(null);

  // ছবি box-এর চেয়ে কত px বড় — এটুকুই সরানো সম্ভব
  function getOverflow() {
    const box = boxRef.current;
    const img = imgRef.current;

    if (!box || !img || !img.naturalWidth) {
      return { overflowX: 0, overflowY: 0 };
    }

    const boxW = box.clientWidth;
    const boxH = box.clientHeight;

    const scale = Math.max(
      boxW / img.naturalWidth,
      boxH / img.naturalHeight,
    );

    return {
      overflowX: Math.max(0, img.naturalWidth * scale - boxW),
      overflowY: Math.max(0, img.naturalHeight * scale - boxH),
    };
  }

  function handlePointerDown(
    e: React.PointerEvent<HTMLDivElement>,
  ) {
    if (!draggable) return;

    e.currentTarget.setPointerCapture(e.pointerId);

    drag.current = {
      startClientX: e.clientX,
      startClientY: e.clientY,
      startX: x,
      startY: y,
      ...getOverflow(),
    };
  }

  function handlePointerMove(
    e: React.PointerEvent<HTMLDivElement>,
  ) {
    const d = drag.current;

    if (!d || !onChange) return;

    const clamp = (n: number) => Math.min(100, Math.max(0, n));

    // টানার উল্টো দিকে position বদলায় (নিচে টানলে উপরের অংশ বেশি দেখা যায়)
    const nextX =
      axis === 'both' && d.overflowX > 1
        ? clamp(
            d.startX -
              ((e.clientX - d.startClientX) / d.overflowX) * 100,
          )
        : d.startX;

    const nextY =
      d.overflowY > 1
        ? clamp(
            d.startY -
              ((e.clientY - d.startClientY) / d.overflowY) * 100,
          )
        : d.startY;

    onChange({ x: nextX, y: nextY });
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
      className={`h-full w-full overflow-hidden ${
        draggable
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
        style={{ objectPosition: `${x}% ${y}%` }}
      />
    </div>
  );
}