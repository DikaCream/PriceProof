import { txExplorerUrl } from "@/lib/config";
import { FAILED_STATUSES, TX_STEPS } from "@/lib/priceproof";

const LABELS: Record<string, string> = {
  PENDING: "Pending",
  PROPOSING: "Proposing",
  COMMITTING: "Committing",
  REVEALING: "Revealing",
  ACCEPTED: "Accepted",
  FINALIZED: "Finalized",
};

/** Live consensus progress for one transaction, driven by its statusName. */
export function TxSteps({ status, hash }: { status: string | null; hash?: string | null }) {
  if (!status) return null;
  const failed = FAILED_STATUSES.has(status);
  const index = TX_STEPS.indexOf(status as (typeof TX_STEPS)[number]);
  return (
    <div className="mt-3" data-testid="tx-steps">
      {status === "SIGNING" ? (
        <p className="text-xs text-teal-200">Confirm the transaction in MetaMask…</p>
      ) : failed ? (
        <p className="text-xs text-rose-300">Consensus failed: {status}</p>
      ) : (
        <ol className="flex flex-wrap items-center gap-1.5" aria-label="Consensus status">
          {TX_STEPS.map((step, i) => {
            const done = index > i || (index === i && (step === "ACCEPTED" || step === "FINALIZED"));
            const active = index === i && !done;
            return (
              <li
                key={step}
                className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                  done
                    ? "bg-emerald-500/15 text-emerald-200"
                    : active
                      ? "bg-teal-400/20 text-teal-100 ring-1 ring-teal-300/40"
                      : "bg-white/[0.04] text-slate-500"
                }`}
              >
                {active && <span className="animate-pulse-dot h-1.5 w-1.5 rounded-full bg-teal-300" />}
                {done && <span>✓</span>}
                {LABELS[step]}
              </li>
            );
          })}
        </ol>
      )}
      {hash && (
        <a
          href={txExplorerUrl(hash)}
          target="_blank"
          rel="noreferrer"
          className="mt-1.5 inline-block font-mono text-[11px] text-slate-500 underline-offset-2 hover:text-slate-300 hover:underline"
        >
          tx {hash.slice(0, 10)}…{hash.slice(-6)} ↗
        </a>
      )}
    </div>
  );
}
