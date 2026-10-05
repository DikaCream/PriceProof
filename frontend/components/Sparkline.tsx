import type { PricePoint } from "@/lib/priceproof";

/** Tiny SVG line chart of verified prices (oldest → newest). */
export function Sparkline({ points, height = 44 }: { points: PricePoint[]; height?: number }) {
  const series = [...points].reverse().map((p) => p.price_e8);
  const width = 240;
  if (series.length < 2) {
    return (
      <div className="flex items-center justify-center rounded-lg border border-dashed border-white/10 text-[11px] text-slate-500" style={{ height }}>
        {series.length === 1 ? "1 verified point. Verify again to draw a chart" : "No history yet"}
      </div>
    );
  }
  const min = Math.min(...series);
  const max = Math.max(...series);
  const span = max - min || 1;
  const step = width / (series.length - 1);
  const coords = series.map((v, i) => [i * step, height - 4 - ((v - min) / span) * (height - 8)] as const);
  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const up = series[series.length - 1] >= series[0];
  const color = up ? "#34d399" : "#fb7185";
  const area = `0,${height} ${line} ${width},${height}`;
  const [lx, ly] = coords[coords.length - 1];
  return (
    <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="w-full" style={{ height }} aria-label="Price history">
      <defs>
        <linearGradient id={`fill-${up ? "up" : "down"}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#fill-${up ? "up" : "down"})`} />
      <polyline points={line} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
      <circle cx={lx} cy={ly} r="3" fill={color} />
    </svg>
  );
}
