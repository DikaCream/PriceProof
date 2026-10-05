import { AlertForm } from "@/components/AlertForm";
import { AlertList } from "@/components/AlertList";
import { Header } from "@/components/Header";
import { HowItWorks } from "@/components/HowItWorks";
import { PriceGrid } from "@/components/PriceGrid";
import { StatsBar } from "@/components/StatsBar";
import { TopUpdaters } from "@/components/TopUpdaters";
import { addressExplorerUrl, CHAIN_NAME, CONTRACT_ADDRESS, TOLERANCE_PCT } from "@/lib/config";

export default function Home() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <section className="pt-10 pb-8">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-teal-300/80">Oracle on GenLayer</p>
          <h1 className="mt-3 max-w-3xl text-3xl font-semibold tracking-tight sm:text-5xl">
            Crypto prices, <span className="text-teal-300">verified by consensus.</span>
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-400 sm:text-base">
            Every price on this page was fetched from the web by GenLayer validators who had to agree within {TOLERANCE_PCT}%. Hit
            <span className="text-slate-200"> Verify now</span> to watch consensus live, then set alerts that fire on-chain.
          </p>
        </section>

        <StatsBar />

        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-slate-400">Verified prices</h2>
          <PriceGrid />
        </section>

        <section className="mt-8 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
          <div className="space-y-4">
            <AlertForm />
            <TopUpdaters />
          </div>
          <AlertList />
        </section>

        <div className="mt-8">
          <HowItWorks />
        </div>
      </main>
      <footer className="border-t border-white/5 py-6 text-center text-xs text-slate-500">
        Built on {CHAIN_NAME}.{" "}
        {CONTRACT_ADDRESS && (
          <>
            Contract{" "}
            <a href={addressExplorerUrl(CONTRACT_ADDRESS)} target="_blank" rel="noreferrer" className="font-mono text-slate-400 hover:text-teal-200">
              {CONTRACT_ADDRESS}
            </a>
          </>
        )}
      </footer>
    </>
  );
}
