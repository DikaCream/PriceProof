"use client";

import { useMarkets, useNow } from "@/lib/hooks";
import { countdown, pts } from "@/lib/format";
import type { Market } from "@/lib/priceproof";
import { OddsBar, OutcomeTag, Panel, StatusTag } from "./ui";

export const FILTERS = ["ALL", "OPEN", "CLOSED", "PROPOSED", "DISPUTED", "FINALIZED", "INVALID"];

function timeCell(m: Market, now: number) {
  if (m.status === "OPEN") return <span className="text-[#D7E0DA]">T-{countdown(m.deadline - now)}</span>;
  if (m.status === "CLOSED") return <span className="text-[#F5A623]">AWAITING RESOLVE</span>;
  if (m.status === "PROPOSED") return <span className="text-[#F5A623]">{m.dispute_open ? `DISPUTE ${countdown(m.dispute_ends - now)}` : "FINALIZABLE"}</span>;
  if (m.status === "DISPUTED") return <span className="text-[#FF4D4D]">APPEAL PENDING</span>;
  if (m.status === "INVALID") return <span className="text-[#8B9A92]">REJECTED</span>;
  return <span className="text-[#8B9A92]">{m.dispute_result ? `DISPUTE ${m.dispute_result}` : "SETTLED"}</span>;
}

export function MarketTable({ filter, setFilter, onOpen }: { filter: string; setFilter: (f: string) => void; onOpen: (id: number) => void }) {
  const { data, isLoading, error } = useMarkets(filter);
  const now = useNow(1000);
  const items = data?.items ?? [];
  return (
    <Panel
      title={`MARKETS // ${filter}`}
      right={<span className="font-mono text-[10px] text-[#8B9A92]">{data ? `${data.total} ROWS` : ""}</span>}
    >
      <div className="grid grid-cols-4 gap-px border-b border-[#1C2620] bg-[#1C2620] sm:flex">
        {FILTERS.map((f, i) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-1 px-2 py-1.5 font-mono text-[10px] tracking-wider ${filter === f ? "bg-[#00FF9A] text-[#070B09]" : "bg-[#0F1612] text-[#8B9A92] hover:text-[#D7E0DA]"}`}
          >
            <span className="hidden opacity-60 sm:inline">{i + 1} </span>
            {f}
          </button>
        ))}
      </div>
      {error && <div className="px-3 py-3 font-mono text-[11px] text-[#FF4D4D]">ERR {(error as Error).message.slice(0, 120)}</div>}
      {isLoading && <div className="blink-cursor px-3 py-3 font-mono text-[11px] text-[#8B9A92]">LOADING MARKETS</div>}
      {!isLoading && !items.length && !error && <div className="px-3 py-6 font-mono text-[11px] text-[#8B9A92]">NO ROWS. PRESS [N] TO CREATE A MARKET.</div>}

      {/* desktop table */}
      {items.length > 0 && (
        <table className="hidden w-full text-left md:table">
          <thead>
            <tr className="border-b border-[#1C2620] font-mono text-[9px] tracking-[0.18em] text-[#8B9A92]">
              <th className="px-3 py-2 font-normal">ID</th>
              <th className="px-2 py-2 font-normal">QUESTION</th>
              <th className="px-2 py-2 font-normal">CAT</th>
              <th className="px-2 py-2 font-normal">YES / NO</th>
              <th className="px-2 py-2 text-right font-normal">POOL</th>
              <th className="px-2 py-2 font-normal">STATUS</th>
              <th className="px-2 py-2 font-normal">OUTCOME</th>
              <th className="px-3 py-2 font-normal">CLOCK</th>
            </tr>
          </thead>
          <tbody className="font-mono text-[12px]">
            {items.map((m) => (
              <tr key={m.id} onClick={() => onOpen(m.id)} className="cursor-pointer border-b border-[#1C2620] hover:bg-[#121A16]">
                <td className="px-3 py-2 text-[#8B9A92]">#{m.id}</td>
                <td className="max-w-[420px] px-2 py-2">
                  <div className="truncate font-sans text-[13px] text-[#D7E0DA]">{m.question}</div>
                  {m.status === "INVALID" && <div className="truncate text-[10px] text-[#FF4D4D]">✕ {m.invalid_reason}</div>}
                </td>
                <td className="px-2 py-2 text-[10px] text-[#8B9A92]">{m.category}</td>
                <td className="px-2 py-2">
                  {m.status === "INVALID" ? <span className="text-[#8B9A92]">— no trading —</span> : <div className="flex items-center gap-2">
                    <span className="w-8 text-right tabular-nums text-[#00FF9A]">{m.yes_pct}%</span>
                    <OddsBar yesPct={m.yes_pct} />
                    <span className="tabular-nums text-[#FF4D4D]">{100 - m.yes_pct}%</span>
                  </div>}
                </td>
                <td className="px-2 py-2 text-right tabular-nums text-[#D7E0DA]">{pts(m.pool)}</td>
                <td className="px-2 py-2"><StatusTag status={m.status} /></td>
                <td className="px-2 py-2"><OutcomeTag outcome={m.outcome} /></td>
                <td className="px-3 py-2 text-[11px] tabular-nums">{timeCell(m, now)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* mobile stacked rows */}
      <div className="md:hidden">
        {items.map((m) => (
          <button key={m.id} onClick={() => onOpen(m.id)} className="block w-full border-b border-[#1C2620] px-3 py-2.5 text-left hover:bg-[#121A16]">
            <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
              <span className="text-[#8B9A92]">#{m.id} · {m.category}</span>
              <StatusTag status={m.status} />
            </div>
            <div className="mt-1 text-[13px] leading-snug text-[#D7E0DA]">{m.question}</div>
            {m.status === "INVALID" ? <div className="mt-1 font-mono text-[10px] text-[#FF4D4D]">✕ {m.invalid_reason}</div> : <div className="mt-1.5 flex items-center gap-2 font-mono text-[11px]">
              <span className="text-[#00FF9A]">Y {m.yes_pct}%</span>
              <OddsBar yesPct={m.yes_pct} wide />
              <span className="text-[#FF4D4D]">N {100 - m.yes_pct}%</span>
            </div>}
            <div className="mt-1 flex justify-between font-mono text-[10px] text-[#8B9A92]">
              <span>POOL {pts(m.pool)}</span>
              <span>{m.outcome ? <OutcomeTag outcome={m.outcome} /> : timeCell(m, now)}</span>
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}
