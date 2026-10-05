import type { PricePoint } from "@/lib/priceproof";

/** Tiny SVG line chart of verified prices (oldest → newest). Terminal palette. */
export function Sparkline({
  points,
  height = 28,
  width = 96,
  className = "",
}: {
  points: PricePoint[];
  height?: number;
  width?: number;
  className?: string;
}) {
  const series = [...points].reverse().map((p) => p.price_e8);
  const w = width;
  const h = height;

  if (series.length === 0) {
    return (
      <div
        className={`flex items-center justify-center border border-dashed border-[#1C2620] font-mono text-[10px] text-[#8B9A92] ${className}`}
        style={{ height: h }}
      >
        —
      </div>
    );
  }

  if (series.length === 1) {
    const y = h / 2;
    return (
      <svg viewBox={`0 0 ${w} ${h}`} className={className} style={{ height: h, width: "100%" }} aria-label="Price history">
        <line x1="4" y1={y} x2={w - 4} y2={y} stroke="#1C2620" strokeWidth="1" strokeDasharray="2 3" />
        <rect x={w / 2 - 2} y={y - 2} width="4" height="4" fill="#00FF9A" />
      </svg>
    );
  }

  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const step = w / (series.length - 1);
  const coords = series.map((v, i) => [i * step, h - 3 - ((v - min) / span) * (h - 6)] as const);
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const up = series[series.length - 1] >= series[0];
  const color = up ? "#00FF9A" : "#FF4D4D";
  const [lx, ly] = coords[coords.length - 1];
  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="none"
      className={className}
      style={{ height: h, width: "100%" }}
      aria-label="Price history"
    >
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="miter"
        strokeLinecap="square"
        vectorEffect="non-scaling-stroke"
      />
      <rect x={lx - 1.5} y={ly - 1.5} width="3" height="3" fill={color} />
    </svg>
  );
}
