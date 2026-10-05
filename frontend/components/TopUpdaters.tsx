"use client";

import { addressExplorerUrl } from "@/lib/config";
import { shortAddress } from "@/lib/format";
import { useTopUpdaters } from "@/lib/hooks";

export function TopUpdaters() {
  const { data = [] } = useTopUpdaters();
  return (
    <section className="border border-[#1C2620] bg-[#0F1612]">
      <div className="border-b border-[#1C2620] px-3 py-2 font-mono text-[11px] tracking-[0.18em] text-[#8B9A92]">
        <span className="text-[#00FF9A]">LEADERBOARD</span> // TOP VERIFIERS
      </div>
      <div className="p-3">
        {data.length === 0 ? (
          <p className="font-mono text-sm text-[#8B9A92]">NO VERIFICATIONS YET.</p>
        ) : (
          <ol className="space-y-1 font-mono text-[12px]">
            {data.map((row, i) => (
              <li key={row.address} className="flex items-center justify-between border-b border-[#1C2620]/50 py-1.5">
                <span className="flex items-center gap-2">
                  <span className="w-5 text-right text-[#8B9A92]">{String(i + 1).padStart(2, "0")}</span>
                  <a href={addressExplorerUrl(row.address)} target="_blank" rel="noreferrer" className="text-[#D7E0DA] hover:text-[#00FF9A]">
                    {shortAddress(row.address)}
                  </a>
                </span>
                <span className="tabular-nums text-[#00FF9A]">{row.updates}</span>
              </li>
            ))}
          </ol>
        )}
      </div>
    </section>
  );
}
