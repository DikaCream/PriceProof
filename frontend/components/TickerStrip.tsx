"use client";

import { useMarkets, useNow } from "@/lib/hooks";
import { countdown } from "@/lib/format";
import type { Market } from "@/lib/priceproof";

function Tick({ m, now }: { m: Market; now: number }) {
  const label =
    m.status === "OPEN" ? `T-${countdown(m.deadline - now)}` : m.status === "PROPOSED" ? `DISPUTE ${countdown(m.dispute_ends - now)}` : m.status;
  return (
    <span className="inline-flex items-center gap-3 whitespace-nowrap px-6 font-mono text-[11px] tracking-wide">
      <span className="text-[#8B9A92]">#{m.id}</span>
      <span className="max-w-[340px] truncate text-[#D7E0DA]">{m.question}</span>
      <span className="text-[#00FF9A]">YES {m.yes_pct}%</span>
      <span className="text-[#FF4D4D]">NO {100 - m.yes_pct}%</span>
      <span className={m.status === "OPEN" ? "text-[#8B9A92]" : "text-[#F5A623]"}>{m.outcome ? `→ ${m.outcome}` : label}</span>
      <span className="text-[#1C2620]">│</span>
    </span>
  );
}

export function TickerStrip() {
  const { data } = useMarkets("ALL");
  const now = useNow(5000);
  const items = (data?.items ?? []).filter((m) => m.status !== "INVALID").slice(0, 12);
  return (
    <div className="overflow-hidden border-b border-[#1C2620] bg-[#0F1612]">
      <div className="flex items-center">
        <div className="shrink-0 border-r border-[#1C2620] bg-[#070B09] px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-[#00FF9A]">LIVE</div>
        <div className="relative flex-1 overflow-hidden py-1.5">
          {items.length ? (
            <div className="ticker-track">
              {[...items, ...items].map((m, i) => (
                <Tick key={`${m.id}-${i}`} m={m} now={now} />
              ))}
            </div>
          ) : (
            <span className="px-6 font-mono text-[11px] text-[#8B9A92]">NO MARKETS YET — CREATE ONE WITH [N]</span>
          )}
        </div>
      </div>
    </div>
  );
}
