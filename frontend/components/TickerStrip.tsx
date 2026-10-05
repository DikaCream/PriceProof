"use client";

import { useEffect, useState } from "react";
import { pctChange, timeAgo, usd } from "@/lib/format";
import { useHistory, usePrices } from "@/lib/hooks";
import type { AssetPrice } from "@/lib/priceproof";

function TickItem({ asset }: { asset: AssetPrice }) {
  const { data: history = [] } = useHistory(asset.symbol);
  const change = history.length > 1 ? pctChange(history[history.length - 1].price_e8, history[0].price_e8) : null;
  const up = change === null ? true : change >= 0;
  return (
    <span className="inline-flex items-center gap-3 whitespace-nowrap px-6 font-mono text-[11px] tracking-wide">
      <span className="text-[#00FF9A]">{asset.symbol}</span>
      <span className="tabular-nums text-[#D7E0DA]">{asset.price_e8 ? usd(asset.price_e8) : "—"}</span>
      <span className={up ? "text-[#00FF9A]" : "text-[#FF4D4D]"}>
        {change === null ? "· NEW" : `${change >= 0 ? "▲" : "▼"}${Math.abs(change).toFixed(2)}%`}
      </span>
      <span className="text-[#8B9A92]">{asset.updated_at ? timeAgo(asset.updated_at) : "UNVERIFIED"}</span>
      <span className="text-[#1C2620]">│</span>
    </span>
  );
}

export function TickerStrip() {
  const { data = [] } = usePrices();
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const items = data.length ? data : ([{ symbol: "BTC" }, { symbol: "ETH" }, { symbol: "SOL" }] as AssetPrice[]);
  const row = (
    <>
      {items.map((a) => (
        <TickItem key={a.symbol + "-a"} asset={a} />
      ))}
      {items.map((a) => (
        <TickItem key={a.symbol + "-b"} asset={a} />
      ))}
    </>
  );

  return (
    <div className="overflow-hidden border-b border-[#1C2620] bg-[#0F1612]">
      <div className="flex items-center">
        <div className="shrink-0 border-r border-[#1C2620] bg-[#070B09] px-3 py-1.5 font-mono text-[10px] tracking-[0.2em] text-[#00FF9A]">
          LIVE
        </div>
        <div className="relative flex-1 overflow-hidden py-1.5">
          <div className="ticker-track">{row}</div>
        </div>
      </div>
    </div>
  );
}
