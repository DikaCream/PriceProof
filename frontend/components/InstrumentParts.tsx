"use client";

import { freshness, pctChange, timeAgo, usd } from "@/lib/format";
import { useHistory } from "@/lib/hooks";
import type { AssetPrice } from "@/lib/priceproof";
import { Sparkline } from "./Sparkline";

const SOURCE_LABEL: Record<string, string> = { coinbase: "COINBASE", coingecko: "COINGECKO", kraken: "KRAKEN" };

export function RowSpark({ symbol }: { symbol: string }) {
  const { data: history = [] } = useHistory(symbol);
  return <Sparkline points={history} height={22} width={88} className="w-[88px]" />;
}

export function InstrumentRow({
  asset,
  active,
  busy,
  canVerify,
  onSelect,
  onVerify,
}: {
  asset: AssetPrice;
  active: boolean;
  busy: boolean;
  canVerify: boolean;
  onSelect: () => void;
  onVerify: () => void;
}) {
  const { data: history = [] } = useHistory(asset.symbol);
  const change = history.length > 1 ? pctChange(history[history.length - 1].price_e8, history[0].price_e8) : null;
  const fresh = freshness(asset.updated_at);
  const freshColor = fresh === "fresh" ? "#00FF9A" : fresh === "aging" ? "#F5A623" : "#FF4D4D";

  return (
    <tr
      onClick={onSelect}
      className={`cursor-pointer border-b border-[#1C2620] ${active ? "bg-[#00FF9A]/10" : "bg-[#0F1612] hover:bg-[#121A16]"}`}
      data-testid="price-card"
    >
      <td className="px-3 py-2.5">
        <div className="flex items-center gap-2">
          <span className="inline-block h-1.5 w-1.5" style={{ background: freshColor }} />
          <span className="font-semibold text-[#00FF9A]">{asset.symbol}</span>
          <span className="text-[10px] text-[#8B9A92]">{asset.name}</span>
        </div>
      </td>
      <td className="px-3 py-2.5 tabular-nums text-[#D7E0DA]">{asset.price_e8 ? usd(asset.price_e8) : "—"}</td>
      <td className={`px-3 py-2.5 tabular-nums ${change !== null && change < 0 ? "text-[#FF4D4D]" : "text-[#00FF9A]"}`}>
        {change === null ? "—" : `${change >= 0 ? "▲" : "▼"}${Math.abs(change).toFixed(2)}%`}
      </td>
      <td className="px-3 py-2.5 text-[#8B9A92]">{asset.updated_at ? timeAgo(asset.updated_at) : "never"}</td>
      <td className="px-3 py-2.5 text-[#F5A623]">{asset.source ? SOURCE_LABEL[asset.source] ?? asset.source : "—"}</td>
      <td className="px-3 py-2.5 tabular-nums text-[#D7E0DA]">{asset.updates}</td>
      <td className="px-3 py-2.5">
        <RowSpark symbol={asset.symbol} />
      </td>
      <td className="px-3 py-2.5" onClick={(e) => e.stopPropagation()}>
        <button onClick={onVerify} disabled={!canVerify || busy} className="pp-btn whitespace-nowrap">
          {busy ? "…" : "[VERIFY]"}
        </button>
      </td>
    </tr>
  );
}

export function MobileInstrument({
  asset,
  active,
  busy,
  canVerify,
  onSelect,
  onVerify,
}: {
  asset: AssetPrice;
  active: boolean;
  busy: boolean;
  canVerify: boolean;
  onSelect: () => void;
  onVerify: () => void;
}) {
  const { data: history = [] } = useHistory(asset.symbol);
  const change = history.length > 1 ? pctChange(history[history.length - 1].price_e8, history[0].price_e8) : null;
  return (
    <div
      onClick={onSelect}
      className={`border-b border-[#1C2620] p-3 ${active ? "bg-[#00FF9A]/10" : "bg-[#0F1612]"}`}
      data-testid="price-card"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="font-mono text-sm text-[#00FF9A]">{asset.symbol}</div>
          <div className="font-mono text-xl tabular-nums text-[#D7E0DA]">{asset.price_e8 ? usd(asset.price_e8) : "—"}</div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onVerify();
          }}
          disabled={!canVerify || busy}
          className="pp-btn"
        >
          {busy ? "…" : "[VERIFY]"}
        </button>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 font-mono text-[10px] text-[#8B9A92]">
        <span className={change !== null && change < 0 ? "text-[#FF4D4D]" : "text-[#00FF9A]"}>
          {change === null ? "Δ —" : `${change >= 0 ? "▲" : "▼"}${Math.abs(change).toFixed(2)}%`}
        </span>
        <span>{asset.updated_at ? timeAgo(asset.updated_at) : "never"}</span>
        <span className="text-[#F5A623]">{asset.source ? SOURCE_LABEL[asset.source] ?? asset.source : "—"}</span>
        <span>UPD {asset.updates}</span>
      </div>
      <div className="mt-2">
        <Sparkline points={history} height={28} width={280} className="w-full" />
      </div>
    </div>
  );
}
