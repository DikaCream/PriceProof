import { txExplorerUrl } from "@/lib/config";
import { FAILED_STATUSES, TX_STEPS } from "@/lib/priceproof";

const LABELS: Record<string, string> = {
  PENDING: "PENDING",
  PROPOSING: "PROPOSING",
  COMMITTING: "COMMITTING",
  REVEALING: "REVEALING",
  ACCEPTED: "ACCEPTED",
  FINALIZED: "FINALIZED",
};

/** Live consensus progress as a terminal log stream. */
export function TxSteps({ status, hash, compact = false }: { status: string | null; hash?: string | null; compact?: boolean }) {
  if (!status) return null;
  const failed = FAILED_STATUSES.has(status);
  const index = TX_STEPS.indexOf(status as (typeof TX_STEPS)[number]);

  if (status === "SIGNING") {
    return (
      <div className="mt-2 font-mono text-[11px] text-[#F5A623]" data-testid="tx-steps">
        <span className="text-[#8B9A92]">&gt;</span> AWAITING_SIGNATURE… confirm in MetaMask
        <span className="blink-cursor" />
      </div>
    );
  }

  if (failed) {
    return (
      <div className="mt-2 font-mono text-[11px] text-[#FF4D4D]" data-testid="tx-steps">
        <span className="text-[#8B9A92]">&gt;</span> FAILED :: {status}
        {hash && (
          <a href={txExplorerUrl(hash)} target="_blank" rel="noreferrer" className="ml-2 text-[#8B9A92] underline hover:text-[#00FF9A]">
            tx/{hash.slice(0, 8)}
          </a>
        )}
      </div>
    );
  }

  const lines =
    index < 0
      ? [`> ${status}`]
      : TX_STEPS.slice(0, index + 1).map((step, i) => {
          const done = i < index || step === "ACCEPTED" || step === "FINALIZED";
          const active = i === index && !done;
          if (step === "ACCEPTED" || step === "FINALIZED") return `> ${LABELS[step]} 5/5`;
          if (active) return `> ${LABELS[step]}…`;
          return `> ${LABELS[step]}`;
        });

  return (
    <div className={`mt-2 border border-[#1C2620] bg-[#070B09] p-2 font-mono text-[11px] leading-5 ${compact ? "" : ""}`} data-testid="tx-steps">
      <div className="mb-1 text-[10px] tracking-widest text-[#8B9A92]">CONSENSUS_LOG</div>
      {lines.map((line, i) => (
        <div
          key={`${line}-${i}`}
          className={`log-line ${line.includes("ACCEPTED") || line.includes("FINALIZED") ? "text-[#00FF9A]" : line.includes("…") ? "text-[#F5A623]" : "text-[#D7E0DA]"}`}
        >
          {line}
          {i === lines.length - 1 && line.includes("…") && <span className="blink-cursor" />}
        </div>
      ))}
      {hash && (
        <a
          href={txExplorerUrl(hash)}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-block text-[10px] text-[#8B9A92] hover:text-[#00FF9A]"
        >
          // tx {hash.slice(0, 10)}…{hash.slice(-6)} ↗
        </a>
      )}
    </div>
  );
}
