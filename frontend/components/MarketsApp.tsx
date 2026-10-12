"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { CreateMarket, type CreateHandle } from "./CreateMarket";
import { HowItWorks } from "./HowItWorks";
import { MarketDetail } from "./MarketDetail";
import { FILTERS, MarketTable } from "./MarketTable";
import { Leaderboard, Portfolio } from "./Portfolio";
import { StatsBar } from "./StatsBar";

export function MarketsApp() {
  const [filter, setFilter] = useState("ALL");
  const [open, setOpen] = useState<number | null>(null);
  const createRef = useRef<CreateHandle>(null);

  const openMarket = useCallback((id: number) => {
    setOpen(id);
    window.scrollTo({ top: 0 });
    history.replaceState(null, "", `#m${id}`);
  }, []);
  const back = useCallback(() => {
    setOpen(null);
    history.replaceState(null, "", location.pathname);
  }, []);

  useEffect(() => {
    const m = location.hash.match(/^#m(\d+)$/);
    if (m) setOpen(parseInt(m[1], 10));
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(t?.tagName)) {
        if (e.key === "Escape") t.blur();
        return;
      }
      if (e.key === "Escape") back();
      else if (e.key === "n" || e.key === "N") {
        e.preventDefault();
        setOpen(null);
        setTimeout(() => createRef.current?.focus(), 0);
      } else if (/^[1-7]$/.test(e.key)) {
        setOpen(null);
        setFilter(FILTERS[parseInt(e.key, 10) - 1]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [back]);

  return (
    <div className="space-y-4">
      <section className="border border-[#1C2620] bg-[#0F1612] px-3 py-3 sm:px-4">
        <div className="font-mono text-[10px] tracking-[0.22em] text-[#00FF9A]">SESSION // AI-RESOLVED PREDICTION MARKETS</div>
        <p className="mt-1 max-w-4xl font-mono text-[12px] leading-5 text-[#8B9A92]">
          YES/NO markets on real-world events. Creators freeze the question, criteria and 1–3 public sources. After the deadline, GenLayer
          validators each <span className="text-[#D7E0DA]">read the sources themselves</span>, must agree on the outcome and cite a verbatim quote.
          Then a <span className="text-[#F5A623]">dispute window</span> opens before payouts.
        </p>
      </section>
      <StatsBar />
      {open !== null ? (
        <MarketDetail id={open} onBack={back} />
      ) : (
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_380px]">
          <MarketTable filter={filter} setFilter={setFilter} onOpen={openMarket} />
          <div className="space-y-4">
            <Portfolio onOpen={openMarket} />
            <Leaderboard />
          </div>
        </div>
      )}
      {open === null && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CreateMarket ref={createRef} onCreated={openMarket} />
          <HowItWorks />
        </div>
      )}
    </div>
  );
}
