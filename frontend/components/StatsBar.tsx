"use client";

import { useStats } from "@/lib/hooks";

export function StatsBar() {
  const { data } = useStats();
  const items = [
    { label: "Assets", value: data?.assets, hint: "tracked" },
    { label: "Verifications", value: data?.updates, hint: `${data?.updaters ?? "-"} updaters` },
    { label: "Alerts", value: data?.alerts, hint: `${data?.active ?? "-"} active` },
    { label: "Triggered", value: data?.triggered, hint: `${data?.cancelled ?? "-"} cancelled` },
  ];
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {items.map((it) => (
        <div key={it.label} className="rounded-xl border border-white/5 bg-white/[0.025] px-4 py-3">
          <p className="text-[11px] uppercase tracking-wider text-slate-500">{it.label}</p>
          <p className="mt-1 font-mono text-2xl font-semibold tabular-nums text-slate-100">{it.value ?? "-"}</p>
          <p className="text-[11px] text-slate-500">{it.hint}</p>
        </div>
      ))}
    </div>
  );
}
