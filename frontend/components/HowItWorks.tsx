import { TOLERANCE_PCT } from "@/lib/config";

const steps = [
  { title: "Request", body: "Anyone calls update_price(symbol) from MetaMask. Studionet is gasless." },
  { title: "Leader fetches", body: "The leader validator reads the USD spot price from Coinbase, falling back to CoinGecko, then Kraken." },
  { title: "Validators verify", body: `Every validator fetches the price on its own and accepts only if it is within ${TOLERANCE_PCT}% of the leader's.` },
  { title: "Stored + alerts", body: "The agreed price, time, source and updater are stored with a 48-point history, and matching alerts fire on-chain." },
];

export function HowItWorks() {
  return (
    <section id="how" className="rounded-2xl border border-white/5 bg-white/[0.03] p-5">
      <h3 className="text-sm font-semibold text-slate-100">How it works</h3>
      <ol className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((s, i) => (
          <li key={s.title} className="flex gap-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-teal-400/15 font-mono text-xs text-teal-200 ring-1 ring-teal-300/30">{i + 1}</span>
            <div>
              <p className="text-sm font-medium text-slate-100">{s.title}</p>
              <p className="mt-0.5 text-xs leading-relaxed text-slate-400">{s.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
