import { Header } from "@/components/Header";
import { TickerStrip } from "@/components/TickerStrip";
import { TerminalApp } from "@/components/TerminalApp";
import { addressExplorerUrl, CHAIN_NAME, CONTRACT_ADDRESS } from "@/lib/config";

export default function Home() {
  return (
    <>
      <TickerStrip />
      <Header />
      <main className="mx-auto max-w-[1400px] px-3 pb-12 pt-4 sm:px-4">
        <TerminalApp />
      </main>
      <footer className="border-t border-[#1C2620] bg-[#0F1612] py-4 text-center font-mono text-[10px] tracking-wide text-[#8B9A92]">
        PRICEPROOF // {CHAIN_NAME.toUpperCase()}
        {CONTRACT_ADDRESS && (
          <>
            {" · "}
            <a href={addressExplorerUrl(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer" className="text-[#D7E0DA] hover:text-[#00FF9A]">
              {CONTRACT_ADDRESS}
            </a>
          </>
        )}
      </footer>
    </>
  );
}
