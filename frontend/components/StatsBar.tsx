"use client";

import { useStats } from "@/lib/hooks";
import { pts } from "@/lib/format";

export function StatsBar() {
  const { data: s } = useStats();
  const b = s?.by_status;
  const cells: [string, string | number, string?][] = [
    ["MARKETS", s?.markets ?? "—"],
    ["OPEN", b?.OPEN ?? "—"],
    ["IN DISPUTE WINDOW", b ? b.PROPOSED + b.DISPUTED : "—", "text-[#F5A623]"],
    ["FINALIZED", b?.FINALIZED ?? "—"],
    ["REJECTED (AI)", b?.INVALID ?? "—", "text-[#FF4D4D]"],
    ["POINTS STAKED", s ? pts(s.total_staked) : "—"],
    ["DISPUTES / FLIPPED", s ? `${s.disputes} / ${s.flipped}` : "—"],
    ["TRADERS", s?.users ?? "—"],
  ];
  return (
    <div className="grid grid-cols-2 border-l border-t border-[#1C2620] bg-[#0F1612] sm:grid-cols-4 lg:grid-cols-8">
      {cells.map(([label, value, color]) => (
        <div key={label} className="border-b border-r border-[#1C2620] px-3 py-2">
          <div className="font-mono text-[9px] tracking-[0.18em] text-[#8B9A92]">{label}</div>
          <div className={`mt-0.5 font-mono text-[15px] tabular-nums ${color ?? "text-[#00FF9A]"}`}>{value}</div>
        </div>
      ))}
    </div>
  );
}
