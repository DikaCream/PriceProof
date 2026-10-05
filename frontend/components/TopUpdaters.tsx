"use client";

import { addressExplorerUrl } from "@/lib/config";
import { shortAddress } from "@/lib/format";
import { useTopUpdaters } from "@/lib/hooks";

export function TopUpdaters() {
  const { data = [] } = useTopUpdaters();
  return (
    <section className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
      <h3 className="text-sm font-semibold text-slate-100">Top verifiers</h3>
      <p className="mt-1 text-xs text-slate-500">Wallets that paid for the most price verifications.</p>
      {data.length === 0 ? (
        <p className="mt-3 text-sm text-slate-500">No verifications yet.</p>
      ) : (
        <ol className="mt-3 space-y-1.5">
          {data.map((row, i) => (
            <li key={row.address} className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2">
                <span className="w-5 text-right font-mono text-xs text-slate-500">{i + 1}</span>
                <a href={addressExplorerUrl(row.address)} target="_blank" rel="noreferrer" className="font-mono text-slate-200 hover:text-teal-200">
                  {shortAddress(row.address)}
                </a>
              </span>
              <span className="font-mono text-xs text-teal-200">{row.updates}</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
