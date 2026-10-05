"use client";

import { useState } from "react";
import { addressExplorerUrl } from "@/lib/config";
import { sameAddress, shortAddress, timeAgo, usd } from "@/lib/format";
import { useAlerts, useMyAlerts, useTx } from "@/lib/hooks";
import type { PriceAlert } from "@/lib/priceproof";
import { useWallet } from "@/lib/WalletProvider";
import { TxSteps } from "./TxSteps";

const STATUS_COLOR = {
  active: "text-[#F5A623] border-[#F5A623]",
  triggered: "text-[#00FF9A] border-[#00FF9A]",
  cancelled: "text-[#8B9A92] border-[#1C2620]",
} as const;

const TRIGGER_LABEL = { create: "ON_CREATE", update: "ON_UPDATE", check: "ON_CHECK", "": "" } as const;

function Ticket({ alert }: { alert: PriceAlert }) {
  const { address, isCorrectChain } = useWallet();
  const tx = useTx();
  const mine = sameAddress(alert.owner, address);
  const canWrite = !!address && isCorrectChain && !tx.busy;
  return (
    <li className="border border-[#1C2620] bg-[#070B09] p-3 font-mono text-[11px]" data-testid="alert-row">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-dashed border-[#1C2620] pb-2">
        <div className="tracking-wide text-[#8B9A92]">
          TICKET <span className="text-[#D7E0DA]">#{String(alert.id).padStart(4, "0")}</span>
        </div>
        <span className={`border px-1.5 py-0.5 text-[10px] tracking-widest uppercase ${STATUS_COLOR[alert.status]}`}>
          {alert.status}
        </span>
      </div>
      <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 sm:grid-cols-4">
        <div>
          <div className="text-[9px] tracking-widest text-[#8B9A92]">SYM</div>
          <div className="text-[#00FF9A]">{alert.symbol}</div>
        </div>
        <div>
          <div className="text-[9px] tracking-widest text-[#8B9A92]">DIR</div>
          <div className={alert.direction === "above" ? "text-[#00FF9A]" : "text-[#FF4D4D]"}>
            {alert.direction === "above" ? "▲ ABOVE" : "▼ BELOW"}
          </div>
        </div>
        <div>
          <div className="text-[9px] tracking-widest text-[#8B9A92]">TARGET</div>
          <div className="tabular-nums text-[#D7E0DA]">{usd(alert.target_e8)}</div>
        </div>
        <div>
          <div className="text-[9px] tracking-widest text-[#8B9A92]">OWNER</div>
          <a href={addressExplorerUrl(alert.owner)} target="_blank" rel="noreferrer" className="text-[#D7E0DA] hover:text-[#00FF9A]">
            {mine ? "YOU" : shortAddress(alert.owner)}
          </a>
        </div>
      </div>
      {alert.note && <p className="mt-2 text-[#8B9A92]">NOTE: {alert.note}</p>}
      <p className="mt-2 text-[10px] text-[#8B9A92]">
        OPENED {timeAgo(alert.created_at)} · REF {alert.price_at_creation_e8 ? usd(alert.price_at_creation_e8) : "N/A"}
      </p>
      {alert.status === "triggered" && (
        <p className="mt-1 text-[#00FF9A]">
          FILLED @ {usd(alert.triggered_price_e8)} · {timeAgo(alert.triggered_at)} · {TRIGGER_LABEL[alert.triggered_by]}
        </p>
      )}
      {alert.status === "active" && (
        <div className="mt-2 flex gap-2">
          <button onClick={() => tx.run("check_alert", [alert.id])} disabled={!canWrite} className="pp-btn">
            [CHECK]
          </button>
          {mine && (
            <button onClick={() => tx.run("cancel_alert", [alert.id])} disabled={!canWrite} className="pp-btn pp-btn-red">
              [CANCEL]
            </button>
          )}
        </div>
      )}
      <TxSteps status={tx.status} hash={tx.hash} compact />
      {tx.error && <p className="mt-1 text-[#FF4D4D]">&gt; ERR {tx.error}</p>}
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
    <section className="border border-[#1C2620] bg-[#0F1612]">
      <div className="flex items-center justify-between border-b border-[#1C2620] px-3 py-2">
        <div className="font-mono text-[11px] tracking-[0.18em] text-[#8B9A92]">
          <span className="text-[#F5A623]">ORDER_BOOK</span> // ALERTS
        </div>
        <div className="flex border border-[#1C2620] font-mono text-[10px]">
          {(["all", "mine"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              disabled={t === "mine" && !address}
              className={`px-2.5 py-1 uppercase tracking-wider disabled:opacity-40 ${
                tab === t ? "bg-[#00FF9A]/15 text-[#00FF9A]" : "text-[#8B9A92]"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>
      <div className="p-3">
        {query.isLoading ? (
          <p className="font-mono text-sm text-[#8B9A92]">LOADING TICKETS<span className="blink-cursor" /></p>
        ) : alerts.length === 0 ? (
          <p className="font-mono text-sm text-[#8B9A92]">
            {tab === "mine" ? "NO TICKETS FOR THIS WALLET." : "ORDER BOOK EMPTY. SEND FIRST ORDER."}
          </p>
        ) : (
          <ul className="space-y-2">
            {alerts.map((a) => (
              <Ticket key={a.id} alert={a} />
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
