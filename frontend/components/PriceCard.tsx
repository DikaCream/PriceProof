"use client";

import { useEffect, useState } from "react";
import { addressExplorerUrl, TOLERANCE_PCT } from "@/lib/config";
import { freshness, pctChange, shortAddress, timeAgo, usd } from "@/lib/format";
import { useHistory, useTx } from "@/lib/hooks";
import type { AssetPrice } from "@/lib/priceproof";
import { useWallet } from "@/lib/WalletProvider";
import { Sparkline } from "./Sparkline";
import { TxSteps } from "./TxSteps";

const SOURCE_LABEL: Record<string, string> = { coinbase: "Coinbase", coingecko: "CoinGecko", kraken: "Kraken" };
const DOT = { fresh: "bg-emerald-400", aging: "bg-amber-400", stale: "bg-rose-400" } as const;

/** Re-renders every 10 s so "verified Xm ago" stays current. */
function useTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);
}

export function PriceCard({ asset }: { asset: AssetPrice }) {
  useTick();
  const { address, isCorrectChain } = useWallet();
  const { data: history = [] } = useHistory(asset.symbol);
  const tx = useTx();
  const [result, setResult] = useState<string | null>(null);

  const fresh = freshness(asset.updated_at);
  const change = history.length > 1 ? pctChange(history[history.length - 1].price_e8, history[0].price_e8) : null;

  async function verify() {
    setResult(null);
    const res = await tx.run("update_price", [asset.symbol]);
    if (res) {
      const v = res.values;
      const triggered = Array.isArray(v.triggered) ? (v.triggered as number[]).length : 0;
      const price = typeof v.price_e8 === "number" ? usd(v.price_e8) : "new price";
      setResult(
        `Verified ${price} via ${SOURCE_LABEL[String(v.source)] ?? v.source}` +
          (triggered ? ` · ${triggered} alert${triggered > 1 ? "s" : ""} triggered` : ""),
      );
    }
  }

  return (
    <article className="flex flex-col rounded-2xl border border-white/5 bg-white/[0.03] p-5" data-testid="price-card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-100">{asset.symbol}</p>
          <p className="text-xs text-slate-500">{asset.name}</p>
        </div>
        {asset.source && (
          <span className="rounded-full bg-teal-400/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-teal-200">
            {SOURCE_LABEL[asset.source] ?? asset.source}
          </span>
        )}
      </div>

      <p className="mt-3 font-mono text-3xl font-semibold tabular-nums tracking-tight text-white">{usd(asset.price_e8)}</p>
      <div className="mt-1 flex items-center gap-2 text-xs text-slate-400">
        <span className={`h-1.5 w-1.5 rounded-full ${DOT[fresh]}`} />
        <span>{asset.updated_at ? `verified ${timeAgo(asset.updated_at)}` : "not verified yet"}</span>
        {change !== null && (
          <span className={`font-mono ${change >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
            {change >= 0 ? "▲" : "▼"} {Math.abs(change).toFixed(2)}%
          </span>
        )}
      </div>

      <div className="mt-4">
        <Sparkline points={history} />
      </div>

      <dl className="mt-3 grid grid-cols-3 gap-2 text-[11px]">
        <div>
          <dt className="text-slate-500">Verifications</dt>
          <dd className="font-mono text-slate-200">{asset.updates}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Active alerts</dt>
          <dd className="font-mono text-slate-200">{asset.active_alerts}</dd>
        </div>
        <div>
          <dt className="text-slate-500">Last updater</dt>
          <dd className="truncate font-mono text-slate-200">
            {asset.updater ? (
              <a href={addressExplorerUrl(asset.updater)} target="_blank" rel="noreferrer" className="hover:text-teal-200">
                {shortAddress(asset.updater)}
              </a>
            ) : (
              "-"
            )}
          </dd>
        </div>
      </dl>

      <button
        onClick={verify}
        disabled={!address || !isCorrectChain || tx.busy}
        title={!address ? "Connect MetaMask to verify" : `Validators fetch the price independently and must agree within ${TOLERANCE_PCT}%`}
        className="mt-4 rounded-lg bg-teal-400 px-3 py-2 text-sm font-semibold text-slate-950 transition hover:bg-teal-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
      >
        {tx.busy ? "Verifying…" : "Verify now"}
      </button>
      <TxSteps status={tx.status} hash={tx.hash} />
      {result && <p className="mt-2 text-xs text-emerald-300">✓ {result}</p>}
      {tx.error && <p className="mt-2 text-xs text-rose-300">{tx.error}</p>}
    </article>
  );
}
