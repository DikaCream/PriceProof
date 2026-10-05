"use client";

import { useEffect, useMemo, useState } from "react";
import { addressExplorerUrl, CONTRACT_ADDRESS, TOLERANCE_PCT } from "@/lib/config";
import { shortAddress, timeAgo, usd } from "@/lib/format";
import { useHistory, usePrices, useTx } from "@/lib/hooks";
import type { AssetPrice, PricePoint } from "@/lib/priceproof";
import { useWallet } from "@/lib/WalletProvider";
import { Sparkline } from "./Sparkline";
import { TxSteps } from "./TxSteps";
import { InstrumentRow, MobileInstrument } from "./InstrumentParts";

const SOURCE_LABEL: Record<string, string> = { coinbase: "COINBASE", coingecko: "COINGECKO", kraken: "KRAKEN" };

function useTick() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);
}

function DetailPanel({
  asset,
  onVerify,
  busy,
  canVerify,
}: {
  asset: AssetPrice;
  onVerify: () => void;
  busy: boolean;
  canVerify: boolean;
}) {
  const { data: history = [] } = useHistory(asset.symbol);
  const chron = useMemo(() => [...(history as PricePoint[])].reverse(), [history]);
  return (
    <div className="border border-[#1C2620] border-t-0 bg-[#0F1612] p-3 sm:p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-mono text-[11px] tracking-[0.2em] text-[#8B9A92]">INSTRUMENT_DETAIL</div>
          <div className="mt-1 font-mono text-xl text-[#00FF9A]">
            {asset.symbol} <span className="text-[#8B9A92]">//</span> <span className="text-[#D7E0DA]">{asset.name}</span>
          </div>
          <div className="mt-1 font-mono text-3xl tabular-nums text-[#D7E0DA]">{asset.price_e8 ? usd(asset.price_e8) : "UNVERIFIED"}</div>
        </div>
        <button onClick={onVerify} disabled={!canVerify || busy} className="pp-btn" title={`Validators must agree within ${TOLERANCE_PCT}%`}>
          {busy ? "VERIFYING…" : "[VERIFY]"}
        </button>
      </div>
      <div className="mt-4 border border-[#1C2620] bg-[#070B09] p-3">
        <Sparkline points={history} height={96} width={640} className="w-full max-w-full" />
      </div>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[480px] border-collapse font-mono text-[11px]">
          <thead>
            <tr className="border-b border-[#1C2620] text-left text-[10px] tracking-widest text-[#8B9A92]">
              <th className="py-1 pr-3">#</th>
              <th className="py-1 pr-3">PRICE</th>
              <th className="py-1 pr-3">AGE</th>
              <th className="py-1 pr-3">SOURCE</th>
              <th className="py-1">UPDATER</th>
            </tr>
          </thead>
          <tbody>
            {chron.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-3 text-[#8B9A92]">
                  No history points. Run VERIFY to seed the tape.
                </td>
              </tr>
            ) : (
              chron
                .slice()
                .reverse()
                .map((p, i) => (
                  <tr key={`${p.timestamp}-${i}`} className="border-b border-[#1C2620]/60 text-[#D7E0DA]">
                    <td className="py-1.5 pr-3 text-[#8B9A92]">{i + 1}</td>
                    <td className="py-1.5 pr-3 tabular-nums">{usd(p.price_e8)}</td>
                    <td className="py-1.5 pr-3 text-[#8B9A92]">{timeAgo(p.timestamp)}</td>
                    <td className="py-1.5 pr-3 text-[#00FF9A]">{SOURCE_LABEL[p.source] ?? p.source ?? "—"}</td>
                    <td className="py-1.5">
                      {p.updater ? (
                        <a href={addressExplorerUrl(p.updater)} target="_blank" rel="noreferrer" className="hover:text-[#00FF9A]">
                          {shortAddress(p.updater)}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                  </tr>
                ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function InstrumentTable({
  selected,
  onSelect,
  tx,
  result,
  onResult,
}: {
  selected: string | null;
  onSelect: (symbol: string | null) => void;
  tx: ReturnType<typeof useTx>;
  result: string | null;
  onResult: (msg: string | null) => void;
}) {
  useTick();
  const { address, isCorrectChain } = useWallet();
  const { data, isLoading, error } = usePrices();
  const assets = data ?? [];

  async function verify(symbol: string) {
    onResult(null);
    onSelect(symbol);
    const res = await tx.run("update_price", [symbol]);
    if (res) {
      const v = res.values;
      const triggered = Array.isArray(v.triggered) ? (v.triggered as number[]).length : 0;
      const price = typeof v.price_e8 === "number" ? usd(v.price_e8) : "new price";
      onResult(
        `OK ${symbol} ${price} via ${SOURCE_LABEL[String(v.source)] ?? v.source}` +
          (triggered ? ` · ${triggered} alert${triggered > 1 ? "s" : ""} triggered` : ""),
      );
    }
  }

  if (!CONTRACT_ADDRESS) {
    return <p className="border border-[#F5A623]/40 bg-[#0F1612] p-3 font-mono text-sm text-[#F5A623]">NEXT_PUBLIC_CONTRACT_ADDRESS is not configured.</p>;
  }
  if (isLoading) {
    return <div className="border border-[#1C2620] bg-[#0F1612] p-6 font-mono text-sm text-[#8B9A92]">LOADING INSTRUMENTS<span className="blink-cursor" /></div>;
  }
  if (error) {
    return <p className="font-mono text-sm text-[#FF4D4D]">Could not load prices: {String((error as Error).message)}</p>;
  }

  const selectedAsset = assets.find((a) => a.symbol === selected) ?? null;
  const canVerify = !!address && isCorrectChain;

  return (
    <div>
      <div className="flex items-center justify-between border border-[#1C2620] border-b-0 bg-[#0F1612] px-3 py-2">
        <div className="font-mono text-[11px] tracking-[0.2em] text-[#8B9A92]">
          <span className="text-[#00FF9A]">INSTRUMENTS</span> // MARKETS
        </div>
        <div className="font-mono text-[10px] text-[#8B9A92]">{assets.length} rows</div>
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto border border-[#1C2620] md:block">
        <table className="w-full min-w-[900px] border-collapse font-mono text-[12px]">
          <thead>
            <tr className="bg-[#121A16] text-left text-[10px] tracking-[0.16em] text-[#8B9A92]">
              {["SYMBOL", "LAST VERIFIED", "Δ", "AGE", "SOURCE", "UPDATES", "SPARK", "ACTION"].map((h) => (
                <th key={h} className="border-b border-[#1C2620] px-3 py-2 font-medium">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {assets.map((asset) => {
              const active = selected === asset.symbol;
              return (
                <InstrumentRow
                  key={asset.symbol}
                  asset={asset}
                  active={active}
                  busy={tx.busy && selected === asset.symbol}
                  canVerify={canVerify}
                  onSelect={() => onSelect(active ? null : asset.symbol)}
                  onVerify={() => verify(asset.symbol)}
                />
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked rows */}
      <div className="space-y-0 border border-[#1C2620] md:hidden">
        {assets.map((asset) => {
          const active = selected === asset.symbol;
          return (
            <MobileInstrument
              key={asset.symbol}
              asset={asset}
              active={active}
              busy={tx.busy && selected === asset.symbol}
              canVerify={canVerify}
              onSelect={() => onSelect(active ? null : asset.symbol)}
              onVerify={() => verify(asset.symbol)}
            />
          );
        })}
      </div>

      {selectedAsset && (
        <DetailPanel
          asset={selectedAsset}
          onVerify={() => verify(selectedAsset.symbol)}
          busy={tx.busy}
          canVerify={canVerify}
        />
      )}

      <div className="border border-[#1C2620] border-t-0 bg-[#070B09] p-3">
        <TxSteps status={tx.status} hash={tx.hash} />
        {result && <p className="mt-2 font-mono text-[11px] text-[#00FF9A]">&gt; {result}</p>}
        {tx.error && <p className="mt-2 font-mono text-[11px] text-[#FF4D4D]">&gt; ERR {tx.error}</p>}
        {!tx.status && !result && !tx.error && (
          <p className="font-mono text-[11px] text-[#8B9A92]">
            &gt; READY · select a row · press <span className="text-[#D7E0DA]">V</span> or click [VERIFY]
            <span className="blink-cursor" />
          </p>
        )}
      </div>
    </div>
  );
}
