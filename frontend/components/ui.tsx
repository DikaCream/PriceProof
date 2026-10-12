import type { MarketStatus, Outcome } from "@/lib/priceproof";

export const STATUS_COLOR: Record<MarketStatus, string> = {
  OPEN: "text-[#00FF9A] border-[#00FF9A]/40",
  CLOSED: "text-[#D7E0DA] border-[#8B9A92]/40",
  PROPOSED: "text-[#F5A623] border-[#F5A623]/40",
  DISPUTED: "text-[#FF4D4D] border-[#FF4D4D]/40",
  FINALIZED: "text-[#8B9A92] border-[#1C2620]",
  INVALID: "text-[#FF4D4D] border-[#FF4D4D]/30 line-through",
};

export function StatusTag({ status }: { status: MarketStatus }) {
  return <span className={`inline-block border px-1.5 py-px font-mono text-[10px] tracking-wider ${STATUS_COLOR[status]}`}>{status}</span>;
}

export function OutcomeTag({ outcome }: { outcome: Outcome }) {
  if (!outcome) return <span className="text-[#8B9A92]">—</span>;
  const c = outcome === "YES" ? "text-[#00FF9A]" : outcome === "NO" ? "text-[#FF4D4D]" : "text-[#F5A623]";
  return <span className={`font-mono text-[11px] font-semibold ${c}`}>{outcome === "UNRESOLVABLE" ? "UNRES" : outcome}</span>;
}

/** YES/NO split bar. */
export function OddsBar({ yesPct, wide = false }: { yesPct: number; wide?: boolean }) {
  return (
    <div className={`flex h-1.5 ${wide ? "w-full" : "w-20"} bg-[#FF4D4D]/70`}>
      <div className="h-full bg-[#00FF9A]" style={{ width: `${yesPct}%` }} />
    </div>
  );
}

export function Panel({ title, right, children, className = "" }: { title: string; right?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`min-w-0 border border-[#1C2620] bg-[#0F1612] ${className}`}>
      <div className="flex items-center justify-between gap-2 border-b border-[#1C2620] px-3 py-2">
        <h2 className="font-mono text-[10px] tracking-[0.22em] text-[#00FF9A]">{title}</h2>
        {right}
      </div>
      {children}
    </section>
  );
}
