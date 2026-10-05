"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTx } from "@/lib/hooks";
import { AlertForm, type AlertFormHandle } from "./AlertForm";
import { AlertList } from "./AlertList";
import { InstrumentTable } from "./InstrumentTable";
import { StatsBar } from "./StatsBar";
import { TopUpdaters } from "./TopUpdaters";
import { HowItWorks } from "./HowItWorks";
import { TOLERANCE_PCT } from "@/lib/config";

export function TerminalApp() {
  const [selected, setSelected] = useState<string | null>("BTC");
  const [result, setResult] = useState<string | null>(null);
  const tx = useTx();
  const formRef = useRef<AlertFormHandle>(null);

  const onKey = useCallback(
    (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const typing = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || (e.target as HTMLElement)?.isContentEditable;
      if (e.key === "/" && !typing) {
        e.preventDefault();
        formRef.current?.focus();
        return;
      }
      if (typing) return;
      if (e.key === "Escape") {
        setSelected(null);
        return;
      }
      if ((e.key === "v" || e.key === "V") && selected && !tx.busy) {
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("pp-verify", { detail: selected }));
      }
    },
    [selected, tx.busy],
  );

  useEffect(() => {
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onKey]);

  return (
    <div className="space-y-4">
      <section className="border border-[#1C2620] bg-[#0F1612] px-3 py-3 sm:px-4">
        <div className="font-mono text-[10px] tracking-[0.22em] text-[#00FF9A]">SESSION // WEB_VERIFIED_ORACLE</div>
        <p className="mt-1 max-w-3xl font-mono text-[12px] leading-5 text-[#8B9A92]">
          Every quote on this tape was fetched from the open web by GenLayer validators who had to agree within {TOLERANCE_PCT}%.
          Select an instrument, run <span className="text-[#D7E0DA]">[VERIFY]</span>, watch the consensus log, then arm alerts as orders.
        </p>
      </section>

      <StatsBar />

      <InstrumentTable
        selected={selected}
        onSelect={setSelected}
        tx={tx}
        result={result}
        onResult={setResult}
      />

      <KeyboardVerifyBridge selected={selected} tx={tx} onResult={setResult} onSelect={setSelected} />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="space-y-4">
          <AlertForm ref={formRef} />
          <TopUpdaters />
        </div>
        <AlertList />
      </div>

      <HowItWorks />
    </div>
  );
}

/** Listens for V-key custom event and triggers verify via shared tx. */
function KeyboardVerifyBridge({
  selected,
  tx,
  onResult,
  onSelect,
}: {
  selected: string | null;
  tx: ReturnType<typeof useTx>;
  onResult: (msg: string | null) => void;
  onSelect: (s: string) => void;
}) {
  useEffect(() => {
    async function handler(e: Event) {
      const symbol = (e as CustomEvent<string>).detail;
      if (!symbol || tx.busy) return;
      onSelect(symbol);
      onResult(null);
      const res = await tx.run("update_price", [symbol]);
      if (res) {
        const v = res.values;
        const triggered = Array.isArray(v.triggered) ? (v.triggered as number[]).length : 0;
        onResult(
          `OK ${symbol}` +
            (typeof v.price_e8 === "number" ? ` ${(v.price_e8 as number) / 1e8}` : "") +
            (triggered ? ` · ${triggered} alerts` : ""),
        );
      }
    }
    window.addEventListener("pp-verify", handler as EventListener);
    return () => window.removeEventListener("pp-verify", handler as EventListener);
  }, [tx, onResult, onSelect]);
  return null;
}
