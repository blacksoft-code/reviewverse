// "৩ / ৫" ধরনের ব্যবহারের bar — limit ভরে গেলে কমলা হয়
export default function UsageBar({
  label,
  value,
  max,
}: {
  label: string;
  value: number;
  max: number;
}) {
  const percent = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  const full = value >= max;

  return (
    <div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-[#424245]">{label}</span>
        <span
          className={`font-medium ${
            full ? 'text-[#a15c00]' : 'text-[#1d1d1f]'
          }`}
        >
          {value} / {max}
        </span>
      </div>

      <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[#f5f5f7]">
        <div
          className={`h-full rounded-full transition-all ${
            full ? 'bg-[#ff9f0a]' : 'bg-[#0071e3]'
          }`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
