"use client";

import { useEffect, useState } from "react";
import { useWallet } from "@/lib/WalletProvider";
import { CHAIN_NAME, CONTRACT_ADDRESS } from "@/lib/config";
import { shortAddress } from "@/lib/format";

export function Logo({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="miter">
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

function Clock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const utc = now.toISOString().replace("T", " ").slice(0, 19) + "Z";
  return <span className="font-mono text-[11px] tabular-nums text-[#8B9A92]">{utc}</span>;
}

export function Header() {
  const { address, isMetaMaskAvailable, isConnecting, isCorrectChain, connect, switchChain, disconnect } = useWallet();
  return (
    <header className="sticky top-0 z-20 border-b border-[#1C2620] bg-[#0F1612]">
      <div className="mx-auto flex h-11 max-w-[1400px] items-center justify-between gap-3 px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="text-[#00FF9A]">
            <Logo />
          </span>
          <div className="min-w-0 font-mono text-[12px] tracking-wide">
            <span className="text-[#00FF9A]">PRICEPROOF</span>
            <span className="text-[#8B9A92]"> // </span>
            <span className="text-[#D7E0DA]">ORACLE TERMINAL</span>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <div className="hidden items-center gap-2 border border-[#1C2620] px-2 py-1 font-mono text-[10px] sm:flex">
            <span className="animate-pulse-dot h-1.5 w-1.5 bg-[#00FF9A]" />
            <span className="text-[#8B9A92]">NET</span>
            <span className="text-[#00FF9A]">{CHAIN_NAME.toUpperCase()}</span>
          </div>
          <div className="hidden md:block">
            <Clock />
          </div>
          {CONTRACT_ADDRESS && (
            <span className="hidden font-mono text-[10px] text-[#8B9A92] lg:inline" title={CONTRACT_ADDRESS}>
              CTR[{shortAddress(CONTRACT_ADDRESS)}]
            </span>
          )}

          {!isMetaMaskAvailable ? (
            <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="pp-btn whitespace-nowrap">
              <span className="sm:hidden">MM</span>
              <span className="hidden sm:inline">Install MetaMask</span>
            </a>
          ) : !address ? (
            <button onClick={connect} disabled={isConnecting} className="pp-btn whitespace-nowrap">
              {isConnecting ? "…" : "Connect"}
            </button>
          ) : !isCorrectChain ? (
            <button onClick={switchChain} className="pp-btn pp-btn-amber whitespace-nowrap">
              Switch
            </button>
          ) : (
            <button onClick={disconnect} title="Disconnect" className="border border-[#1C2620] px-2 py-1 font-mono text-[11px] text-[#00FF9A] hover:border-[#00FF9A]">
              [{shortAddress(address)}]
            </button>
          )}
        </div>
      </div>
      <div className="hidden border-t border-[#1C2620] bg-[#070B09] px-3 py-1 font-mono text-[10px] text-[#8B9A92] sm:block sm:px-4">
        <span className="text-[#F5A623]">KEYS</span>
        <span className="mx-2 text-[#1C2620]">|</span>
        <kbd className="text-[#D7E0DA]">V</kbd> verify selected
        <span className="mx-2 text-[#1C2620]">|</span>
        <kbd className="text-[#D7E0DA]">/</kbd> focus order entry
        <span className="mx-2 text-[#1C2620]">|</span>
        <kbd className="text-[#D7E0DA]">Esc</kbd> clear selection
      </div>
    </header>
  );
}
