"use client";

import { useWallet } from "@/lib/WalletProvider";
import { CHAIN_NAME } from "@/lib/config";
import { shortAddress } from "@/lib/format";

export function Logo({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 17l6-6 4 4 8-8" />
      <path d="M15 7h6v6" />
    </svg>
  );
}

export function Header() {
  const { address, isMetaMaskAvailable, isConnecting, isCorrectChain, connect, switchChain, disconnect } = useWallet();
  return (
    <header className="sticky top-0 z-20 border-b border-white/5 bg-[#03110f]/75 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-teal-400/15 text-teal-300 ring-1 ring-teal-300/30">
            <Logo />
          </div>
          <div>
            <p className="text-base font-semibold tracking-tight">PriceProof</p>
            <p className="text-xs text-slate-500">Web-verified price oracle</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden items-center gap-1.5 rounded-full border border-white/10 px-3 py-1 text-xs text-slate-400 sm:flex">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            {CHAIN_NAME}
          </span>
          {!isMetaMaskAvailable ? (
            <a href="https://metamask.io/download/" target="_blank" rel="noreferrer" className="rounded-lg bg-white px-3.5 py-2 text-sm font-medium text-slate-900 hover:bg-slate-200">
              Install MetaMask
            </a>
          ) : !address ? (
            <button onClick={connect} disabled={isConnecting} className="rounded-lg bg-teal-400 px-3.5 py-2 text-sm font-semibold text-slate-950 hover:bg-teal-300 disabled:opacity-60">
              {isConnecting ? "Connecting…" : "Connect MetaMask"}
            </button>
          ) : !isCorrectChain ? (
            <button onClick={switchChain} className="rounded-lg bg-amber-400 px-3.5 py-2 text-sm font-semibold text-slate-950 hover:bg-amber-300">
              Switch to {CHAIN_NAME}
            </button>
          ) : (
            <button onClick={disconnect} title="Disconnect" className="group flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 font-mono text-sm text-slate-200 hover:border-white/20">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              <span className="group-hover:hidden">{shortAddress(address)}</span>
              <span className="hidden font-sans group-hover:inline">Disconnect</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
