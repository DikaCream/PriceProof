"use client";

import { forwardRef, useImperativeHandle, useRef, useState } from "react";
import { MAX_NOTE_LENGTH } from "@/lib/config";
import { usd } from "@/lib/format";
import { usePrices, useTx } from "@/lib/hooks";
import { useWallet } from "@/lib/WalletProvider";
import { TxSteps } from "./TxSteps";

export type AlertFormHandle = { focus: () => void };

export const AlertForm = forwardRef<AlertFormHandle>(function AlertForm(_props, ref) {
  const { address, isCorrectChain } = useWallet();
  const { data: prices = [] } = usePrices();
  const [symbol, setSymbol] = useState("BTC");
  const [direction, setDirection] = useState<"above" | "below">("above");
  const [target, setTarget] = useState("");
  const [note, setNote] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const tx = useTx();
  const targetRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => targetRef.current?.focus(),
  }));

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
          ? `ORDER #${v.id} FILLED @ $${v.triggered_price}`
          : `ORDER #${v.id ?? ""} ARMED · ${symbol} ${direction.toUpperCase()} $${v.target ?? target}`,
      );
      setTarget("");
      setNote("");
    }
  }

  return (
    <form id="order-entry" onSubmit={submit} className="border border-[#1C2620] bg-[#0F1612]">
      <div className="flex items-center justify-between border-b border-[#1C2620] px-3 py-2">
        <div className="font-mono text-[11px] tracking-[0.18em] text-[#8B9A92]">
          <span className="text-[#F5A623]">ORDER_ENTRY</span> // CREATE ALERT
        </div>
        <div className="font-mono text-[10px] text-[#8B9A92]">cmd:/</div>
      </div>
      <div className="space-y-2 p-3">
        <div className="font-mono text-[11px] text-[#8B9A92]">
          <span className="text-[#00FF9A]">$</span> new_alert{" "}
          <span className="text-[#D7E0DA]">
            --sym {symbol} --dir {direction} --px {target || "?"}
          </span>
          <span className="blink-cursor" />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <select value={symbol} onChange={(e) => setSymbol(e.target.value)} className="pp-select" aria-label="Asset">
            {(prices.length ? prices.map((p) => p.symbol) : ["BTC", "ETH", "SOL"]).map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <div className="grid grid-cols-2 border border-[#1C2620]" role="radiogroup" aria-label="Direction">
            {(["above", "below"] as const).map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDirection(d)}
                className={`px-2 py-2 font-mono text-[11px] uppercase ${
                  direction === d
                    ? d === "above"
                      ? "bg-[#00FF9A]/15 text-[#00FF9A]"
                      : "bg-[#FF4D4D]/15 text-[#FF4D4D]"
                    : "text-[#8B9A92]"
                }`}
              >
                {d === "above" ? "▲ ABOVE" : "▼ BELOW"}
              </button>
            ))}
          </div>
        </div>

        <label className="block">
          <span className="mb-1 block font-mono text-[10px] tracking-widest text-[#8B9A92]">TARGET_USD</span>
          <div className="flex items-center border border-[#1C2620] bg-[#070B09] focus-within:border-[#00FF9A]">
            <span className="px-2 font-mono text-sm text-[#8B9A92]">$</span>
            <input
              ref={targetRef}
              value={target}
              onChange={(e) => setTarget(e.target.value.replace(/[^\d.]/g, ""))}
              placeholder={current?.price_e8 ? (current.price_e8 / 1e8).toFixed(2) : "0.00"}
              inputMode="decimal"
              className="w-full bg-transparent py-2 pr-3 font-mono text-sm text-[#D7E0DA] outline-none placeholder:text-[#8B9A92]/40"
            />
          </div>
        </label>
        <p className="font-mono text-[10px] text-[#8B9A92]">
          LAST {symbol}: {current?.price_e8 ? usd(current.price_e8) : "UNVERIFIED"}
        </p>

        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          maxLength={MAX_NOTE_LENGTH}
          placeholder="NOTE (optional)"
          className="pp-input"
        />

        <button type="submit" disabled={!canSubmit} className="pp-btn w-full">
          {!address ? "CONNECT TO SEND" : tx.busy ? "SUBMITTING…" : "SEND ORDER [ENTER]"}
        </button>
        <TxSteps status={tx.status} hash={tx.hash} compact />
        {result && <p className="font-mono text-[11px] text-[#00FF9A]">&gt; {result}</p>}
        {tx.error && <p className="font-mono text-[11px] text-[#FF4D4D]">&gt; ERR {tx.error}</p>}
      </div>
    </form>
  );
});
