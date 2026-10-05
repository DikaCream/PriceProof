"use client";

import { useStats } from "@/lib/hooks";

export function StatsBar() {
  const { data } = useStats();
  const items = [
    { k: "ASSETS", v: data?.assets },
    { k: "VERIFS", v: data?.updates },
    { k: "UPDATERS", v: data?.updaters },
    { k: "ALERTS", v: data?.alerts },
    { k: "ACTIVE", v: data?.active },
    { k: "TRIGGERED", v: data?.triggered },
  ];
  return (
    <div className="grid grid-cols-3 border border-[#1C2620] sm:grid-cols-6">
      {items.map((it, i) => (
        <div key={it.k} className={`bg-[#0F1612] px-3 py-2 ${i ? "border-l border-[#1C2620]" : ""}`}>
          <div className="font-mono text-[9px] tracking-[0.18em] text-[#8B9A92]">{it.k}</div>
          <div className="mt-0.5 font-mono text-lg tabular-nums text-[#00FF9A]">{it.v ?? "—"}</div>
        </div>
      ))}
    </div>
  );
}
