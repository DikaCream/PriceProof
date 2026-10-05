"use client";

import { CONTRACT_ADDRESS } from "@/lib/config";
import { usePrices } from "@/lib/hooks";
import { PriceCard } from "./PriceCard";

export function PriceGrid() {
  const { data, isLoading, error } = usePrices();
  if (!CONTRACT_ADDRESS) {
    return <p className="rounded-xl border border-amber-400/20 bg-amber-400/5 p-4 text-sm text-amber-200">NEXT_PUBLIC_CONTRACT_ADDRESS is not configured.</p>;
  }
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[0, 1, 2].map((i) => (
          <div key={i} className="h-80 animate-pulse rounded-2xl border border-white/5 bg-white/[0.03]" />
        ))}
      </div>
    );
  }
  if (error) return <p className="text-sm text-rose-300">Could not load prices from Studionet: {String((error as Error).message)}</p>;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {(data ?? []).map((asset) => (
        <PriceCard key={asset.symbol} asset={asset} />
      ))}
    </div>
  );
}
