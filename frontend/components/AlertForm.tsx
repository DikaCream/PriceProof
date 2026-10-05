"use client";

import { useState } from "react";
import { MAX_NOTE_LENGTH } from "@/lib/config";
import { usd } from "@/lib/format";
import { usePrices, useTx } from "@/lib/hooks";
import { useWallet } from "@/lib/WalletProvider";
import { TxSteps } from "./TxSteps";

export function AlertForm() {
  const { address, isCorrectChain } = useWallet();
  const { data: prices = [] } = usePrices();
  const [symbol, setSymbol] = useState("BTC");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [target, setTarget] = useState("");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const tx = useTx();

  const current = prices.find((p) => p.symbol === symbol);
  const validTarget = /^\d+(\.\d{1,8})?$/.test(target.trim()) && Number(target) > 0;
  const canSubmit = !!address && isCorrectChain && validTarget && note.length <= MAX_NOTE_LENGTH && !tx.busy;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setResult(null);
    const res = await tx.run("create_alert", [symbol, target.trim(), direction, note.trim()]);
    if (res) {
      const v = res.values;
      setResult(
        v.status === "triggered"
          ? `Alert #${v.id} created and triggered immediately at $${v.triggered_price}`
          : `Alert #${v.id ?? ""} is active. It triggers when a verified ${symbol} price goes ${direction} $${v.target ?? target}`,
      );
      setTarget("");
      setNote("");
    }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
      <h3 className="text-sm font-semibold text-slate-100">Create a price alert</h3>
      <p className="mt-1 text-xs text-slate-500">Alerts are checked on-chain against every verified price, so anyone can see when they fire.</p>

      <div className="mt-4 grid grid-cols-2 gap-2">
        <select
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
          className="rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none focus:border-teal-300/50"
          aria-label="Asset"
        >
          {(prices.length ? prices.map((p) => p.symbol) : ["BTC", "ETH", "SOL"]).map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
        <div className="flex rounded-lg border border-white/10 p-0.5" role="radiogroup" aria-label="Direction">
          {(["above", "below"] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setDirection(d)}
              className={`flex-1 rounded-md px-2 py-1.5 text-xs font-medium capitalize ${
                direction === d ? (d === "above" ? "bg-emerald-400/20 text-emerald-200" : "bg-rose-400/20 text-rose-200") : "text-slate-400"
              }`}
            >
              {d === "above" ? "▲ above" : "▼ below"}
            </button>
          ))}
        </div>
      </div>

      <label className="mt-2 block">
        <span className="sr-only">Target price in USD</span>
        <div className="flex items-center rounded-lg border border-white/10 bg-slate-950/60 px-3 focus-within:border-teal-300/50">
          <span className="text-sm text-slate-500">$</span>
          <input
            value={target}
            onChange={(e) => setTarget(e.target.value.replace(/[^\d.]/g, ""))}
            placeholder={current?.price_e8 ? (current.price_e8 / 1e8).toFixed(2) : "Target price"}
            inputMode="decimal"
            className="w-full bg-transparent px-2 py-2 font-mono text-sm text-slate-100 outline-none placeholder:text-slate-600"
          />
        </div>
      </label>
      <p className="mt-1 text-[11px] text-slate-500">Last verified {symbol}: {current?.price_e8 ? usd(current.price_e8) : "not verified yet"}</p>

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={MAX_NOTE_LENGTH}
        placeholder="Note (optional), e.g. take profit"
        className="mt-2 w-full rounded-lg border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600 focus:border-teal-300/50"
      />

      <button
        type="submit"
        disabled={!canSubmit}
        className="mt-3 w-full rounded-lg bg-teal-400 px-3 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-300 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
      >
        {!address ? "Connect MetaMask to create alerts" : tx.busy ? "Creating…" : "Create alert"}
      </button>
      <TxSteps status={tx.status} hash={tx.hash} />
      {result && <p className="mt-2 text-xs text-emerald-300">✓ {result}</p>}
      {tx.error && <p className="mt-2 text-xs text-rose-300">{tx.error}</p>}
    </form>
  );
}
