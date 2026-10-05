"use client";

import { useState } from "react";
import { addressExplorerUrl } from "@/lib/config";
import { sameAddress, shortAddress, timeAgo, usd } from "@/lib/format";
import { useAlerts, useMyAlerts, useTx } from "@/lib/hooks";
import type { PriceAlert } from "@/lib/priceproof";
import { useWallet } from "@/lib/WalletProvider";
import { TxSteps } from "./TxSteps";

const STATUS_STYLE = {
  active: "bg-teal-400/15 text-teal-200",
  triggered: "bg-emerald-400/15 text-emerald-200",
  cancelled: "bg-white/5 text-slate-400",
} as const;

const TRIGGER_LABEL = { create: "on creation", update: "by a price update", check: "by a manual check", "": "" } as const;

function AlertRow({ alert }: { alert: PriceAlert }) {
  const { address, isCorrectChain } = useWallet();
  const tx = useTx();
  const mine = sameAddress(alert.owner, address);
  const canWrite = !!address && isCorrectChain && !tx.busy;
  return (
    <li className="rounded-xl border border-white/5 bg-white/[0.02] p-4" data-testid="alert-row">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm">
          <span className="font-mono text-slate-500">#{alert.id}</span>
          <span className="font-semibold text-slate-100">{alert.symbol}</span>
          <span className={alert.direction === "above" ? "text-emerald-300" : "text-rose-300"}>
            {alert.direction === "above" ? "▲ above" : "▼ below"}
          </span>
          <span className="font-mono text-slate-100">{usd(alert.target_e8)}</span>
        </div>
        <span className={`rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${STATUS_STYLE[alert.status]}`}>{alert.status}</span>
      </div>
      {alert.note && <p className="mt-1 text-sm text-slate-300">{alert.note}</p>}
      <p className="mt-2 text-[11px] text-slate-500">
        by{" "}
        <a href={addressExplorerUrl(alert.owner)} target="_blank" rel="noreferrer" className="font-mono hover:text-teal-200">
          {mine ? "you" : shortAddress(alert.owner)}
        </a>{" "}
        · {timeAgo(alert.created_at)} · price then {alert.price_at_creation_e8 ? usd(alert.price_at_creation_e8) : "unverified"}
      </p>
      {alert.status === "triggered" && (
        <p className="mt-1 text-xs text-emerald-300">
          ✓ Triggered at {usd(alert.triggered_price_e8)} {timeAgo(alert.triggered_at)} {TRIGGER_LABEL[alert.triggered_by]}
        </p>
      )}
      {alert.status === "active" && (
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => tx.run("check_alert", [alert.id])}
            disabled={!canWrite}
            className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-slate-300 hover:border-teal-300/40 disabled:opacity-40"
          >
            Check now
          </button>
          {mine && (
            <button
              onClick={() => tx.run("cancel_alert", [alert.id])}
              disabled={!canWrite}
              className="rounded-md border border-white/10 px-2 py-1 text-[11px] text-rose-300 hover:border-rose-300/40 disabled:opacity-40"
            >
              Cancel
            </button>
          )}
        </div>
      )}
      <TxSteps status={tx.status} hash={tx.hash} />
      {tx.error && <p className="mt-1 text-xs text-rose-300">{tx.error}</p>}
    </li>
  );
}

export function AlertList() {
  const { address } = useWallet();
  const [tab, setTab] = useState<"all" | "mine">("all");
  const all = useAlerts();
  const mine = useMyAlerts(address);
  const query = tab === "all" ? all : mine;
  const alerts = query.data ?? [];
  return (
    <section className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-100">Alerts</h3>
        <div className="flex rounded-lg border border-white/10 p-0.5 text-xs">
          {(["all", "mine"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              disabled={t === "mine" && !address}
              className={`rounded-md px-2.5 py-1 capitalize disabled:opacity-40 ${tab === t ? "bg-teal-400/20 text-teal-100" : "text-slate-400"}`}
            >
              {t === "all" ? "All" : "Mine"}
            </button>
          ))}
        </div>
      </div>
      {query.isLoading ? (
        <p className="mt-4 text-sm text-slate-500">Loading alerts…</p>
      ) : alerts.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">{tab === "mine" ? "You have no alerts yet." : "No alerts yet. Create the first one."}</p>
      ) : (
        <ul className="mt-4 space-y-2">
          {alerts.map((a) => (
            <AlertRow key={a.id} alert={a} />
          ))}
        </ul>
      )}
    </section>
  );
}
