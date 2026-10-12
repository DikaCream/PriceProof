"use client";

import { useState } from "react";
import { useEvidence, useMarket, useNow, usePosition, useTx, useUser } from "@/lib/hooks";
import { useWallet } from "@/lib/WalletProvider";
import { countdown, host, pts, shortAddress, utc } from "@/lib/format";
import { DISPUTE_BOND } from "@/lib/config";
import { checkUrl } from "@/lib/rules";
import type { Market } from "@/lib/priceproof";
import { OddsBar, OutcomeTag, Panel, StatusTag } from "./ui";
import { TxSteps } from "./TxSteps";

function TxOut({ tx }: { tx: ReturnType<typeof useTx> }) {
  return (
    <>
      <TxSteps status={tx.status} hash={tx.hash} />
      {tx.error && <div className="mt-2 border border-[#FF4D4D]/40 px-2 py-1.5 font-mono text-[11px] text-[#FF4D4D]">ERR :: {tx.error}</div>}
    </>
  );
}

function StakeForm({ m }: { m: Market }) {
  const { address } = useWallet();
  const { data: user } = useUser(address);
  const [side, setSide] = useState<"YES" | "NO">("YES");
  const [amount, setAmount] = useState("100");
  const tx = useTx();
  const amt = parseInt(amount || "0", 10) || 0;
  const pool = m.pool + amt;
  const sidePool = (side === "YES" ? m.yes_total : m.no_total) + amt;
  const est = amt > 0 ? Math.floor((amt * pool) / sidePool) : 0;
  const bal = user?.balance ?? 0;
  return (
    <div className="space-y-3 p-3">
      <div className="grid grid-cols-2 gap-px bg-[#1C2620]">
        {(["YES", "NO"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setSide(s)}
            className={`py-2 font-mono text-[12px] tracking-wider ${side === s ? (s === "YES" ? "bg-[#00FF9A] text-[#070B09]" : "bg-[#FF4D4D] text-[#070B09]") : "bg-[#070B09] text-[#8B9A92]"}`}
          >
            {s === "YES" ? "▲ BUY YES" : "▼ BUY NO"} {s === "YES" ? m.yes_pct : 100 - m.yes_pct}%
          </button>
        ))}
      </div>
      <label className="block font-mono text-[10px] tracking-wider text-[#8B9A92]">
        QTY (POINTS) · BAL {address ? pts(bal) : "—"}
        <div className="mt-1 flex">
          <span className="border border-r-0 border-[#1C2620] bg-[#070B09] px-2 py-2 font-mono text-[12px] text-[#00FF9A]">&gt;</span>
          <input className="pp-input" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
        </div>
      </label>
      <div className="flex gap-1">
        {[50, 100, 250, 500].map((v) => (
          <button key={v} onClick={() => setAmount(String(v))} className="flex-1 border border-[#1C2620] py-1 font-mono text-[10px] text-[#8B9A92] hover:border-[#00FF9A] hover:text-[#00FF9A]">
            {v}
          </button>
        ))}
      </div>
      <div className="font-mono text-[11px] leading-5 text-[#8B9A92]">
        <div className="flex justify-between"><span>EST. PAYOUT IF {side}</span><span className="text-[#D7E0DA]">{pts(est)} pts</span></div>
        <div className="flex justify-between"><span>IMPLIED MULTIPLIER</span><span className="text-[#D7E0DA]">{amt ? (est / amt).toFixed(2) : "—"}x</span></div>
      </div>
      {address && user && !user.claimed_start ? (
        <button className="pp-btn w-full" disabled={tx.busy} onClick={() => tx.run("claim_points", [])}>[CLAIM 1000 STARTING POINTS]</button>
      ) : (
        <button className="pp-btn w-full" disabled={tx.busy || !address || amt < 10 || amt > bal} onClick={() => tx.run("stake", [m.id, side, amt])}>
          {!address ? "CONNECT WALLET TO STAKE" : `[SUBMIT ${side} ${amt} PTS]`}
        </button>
      )}
      <TxOut tx={tx} />
    </div>
  );
}

function EvidenceLog({ m }: { m: Market }) {
  const { data = [] } = useEvidence(m.id, m.rounds);
  const lines: { t: number; c: string; text: React.ReactNode }[] = [
    { t: m.created_at, c: "text-[#8B9A92]", text: `MARKET CREATED by ${shortAddress(m.creator)} · ${m.sources.length} source(s) frozen` },
    { t: m.created_at, c: m.status === "INVALID" ? "text-[#FF4D4D]" : "text-[#00FF9A]", text: m.status === "INVALID" ? `VALIDITY CHECK :: REJECTED — ${m.invalid_reason}` : "VALIDITY CHECK :: PASSED (validators agreed)" },
  ];
  const disputeLine = m.disputer
    ? { t: m.proposed_at, c: "text-[#FF4D4D]", text: `DISPUTE by ${shortAddress(m.disputer)} (bond ${DISPUTE_BOND}) :: ${m.dispute_reason}${m.dispute_source ? ` + ${host(m.dispute_source)}` : ""}` }
    : null;
  data.forEach((r, i) => {
    if (r.kind === "APPEAL" && disputeLine) lines.push({ ...disputeLine, t: r.timestamp });
    lines.push({
      t: r.timestamp,
      c: r.kind === "APPEAL" ? "text-[#F5A623]" : "text-[#D7E0DA]",
      text: (
        <div>
          <div>
            ROUND {i + 1} [{r.kind}] by {shortAddress(r.caller)} :: <OutcomeTag outcome={r.outcome} /> · {r.sources.length} sources read
          </div>
          {r.evidence_quote && <div className="mt-1 border-l-2 border-[#00FF9A] pl-2 font-sans text-[12px] italic text-[#D7E0DA]">“{r.evidence_quote}”</div>}
          {r.source_url && (
            <a href={r.source_url} target="_blank" rel="noreferrer" className="mt-0.5 block truncate text-[10px] text-[#00FF9A] hover:underline">
              ↳ {r.source_url}
            </a>
          )}
          {r.reasoning && <div className="mt-0.5 text-[10px] text-[#8B9A92]">{r.reasoning}</div>}
        </div>
      ),
    });
  });
  if (disputeLine && m.status === "DISPUTED") lines.push(disputeLine);
  if (m.dispute_result) lines.push({ t: m.finalized_at, c: "text-[#F5A623]", text: `DISPUTE ${m.dispute_result}${m.dispute_result === "FLIPPED" ? " — bond returned + reward" : " — bond slashed to winners' pool"}` });
  if (m.status === "FINALIZED") lines.push({ t: m.finalized_at, c: "text-[#00FF9A]", text: `FINALIZED :: ${m.outcome}${m.outcome === "UNRESOLVABLE" ? " — all stakes refunded" : ""}` });
  return (
    <div className="max-h-[420px] overflow-y-auto bg-[#070B09] px-3 py-2 font-mono text-[11px] leading-5">
      {lines.map((l, i) => (
        <div key={i} className={`log-line flex gap-2 py-0.5 ${l.c}`}>
          <span className="shrink-0 text-[#00FF9A]">&gt;</span>
          <span className="shrink-0 text-[#8B9A92]">{utc(l.t).slice(11)}</span>
          <div className="min-w-0 flex-1">{l.text}</div>
        </div>
      ))}
      {(m.status === "CLOSED" || m.status === "DISPUTED") && <div className="blink-cursor py-0.5 text-[#F5A623]">&gt; AWAITING {m.status === "CLOSED" ? "resolve()" : "resolve_dispute()"}</div>}
    </div>
  );
}

function Actions({ m, now }: { m: Market; now: number }) {
  const { address } = useWallet();
  const { data: pos } = usePosition(m.id, address);
  const tx = useTx();
  const [reason, setReason] = useState("");
  const [extra, setExtra] = useState("");
  const extraCheck = extra.trim() ? checkUrl(extra) : null;
  const hasPos = !!pos && pos.yes + pos.no > 0;
  const windowLeft = m.dispute_ends - now;
  return (
    <div className="space-y-3 p-3 font-mono text-[11px]">
      {m.status === "OPEN" && <div className="text-[#8B9A92]">Resolution unlocks in <span className="text-[#D7E0DA]">{countdown(m.deadline - now)}</span> (deadline {utc(m.deadline)}).</div>}
      {m.status === "CLOSED" && (
        <button className="pp-btn pp-btn-amber w-full" disabled={tx.busy} onClick={() => tx.run("resolve", [m.id])}>[RESOLVE — VALIDATORS READ SOURCES]</button>
      )}
      {m.status === "PROPOSED" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between border border-[#F5A623]/40 px-2 py-2">
            <span className="text-[#F5A623]">DISPUTE WINDOW</span>
            <span className="text-[16px] tabular-nums text-[#F5A623]">{windowLeft > 0 ? countdown(windowLeft) : "CLOSED"}</span>
          </div>
          {windowLeft > 0 ? (
            hasPos ? (
              <>
                <textarea className="pp-input h-16 resize-none" placeholder="reason (10-400 chars): why the proposed outcome is wrong" value={reason} onChange={(e) => setReason(e.target.value)} />
                <input className="pp-input" placeholder="optional extra source https://…" value={extra} onChange={(e) => setExtra(e.target.value)} />
                {extraCheck && <div className={extraCheck.level === "err" ? "text-[#FF4D4D]" : extraCheck.level === "warn" ? "text-[#F5A623]" : "text-[#00FF9A]"}>{extraCheck.msg}</div>}
                <button className="pp-btn pp-btn-red w-full" disabled={tx.busy || reason.trim().length < 10 || extraCheck?.level === "err"} onClick={() => tx.run("dispute", [m.id, reason, extra.trim()])}>
                  [DISPUTE — BOND {DISPUTE_BOND} PTS]
                </button>
              </>
            ) : (
              <div className="text-[#8B9A92]">Only wallets with a position can dispute.</div>
            )
          ) : (
            <button className="pp-btn w-full" disabled={tx.busy} onClick={() => tx.run("finalize", [m.id])}>[FINALIZE]</button>
          )}
        </div>
      )}
      {m.status === "FINALIZED" && (
        <div className="border border-[#1C2620] px-2 py-2 leading-5">
          <div className="text-[9px] tracking-[0.18em] text-[#8B9A92]">SETTLED</div>
          <div>OUTCOME <OutcomeTag outcome={m.outcome} /> · POOL {pts(m.pool)} pts{m.slashed ? ` (incl. ${m.slashed} slashed)` : ""}</div>
          <div className="text-[#8B9A92]">{m.outcome === "UNRESOLVABLE" ? "All stakes refunded on claim." : "Winners claim pro-rata from the pool."}{!address && " Connect a wallet to claim."}</div>
        </div>
      )}
      {m.status === "DISPUTED" && (
        <button className="pp-btn pp-btn-amber w-full" disabled={tx.busy} onClick={() => tx.run("resolve_dispute", [m.id])}>[RUN APPEAL ROUND]</button>
      )}
      {hasPos && pos && (
        <div className="border border-[#1C2620] px-2 py-2 leading-5">
          <div className="text-[9px] tracking-[0.18em] text-[#8B9A92]">YOUR POSITION</div>
          <div className="flex justify-between"><span className="text-[#00FF9A]">YES {pts(pos.yes)}</span><span className="text-[#FF4D4D]">NO {pts(pos.no)}</span></div>
          {pos.claimed && <div className="text-[#8B9A92]">CLAIMED {pts(pos.payout)} pts</div>}
          {(m.status === "FINALIZED" || (m.status === "PROPOSED" && windowLeft <= 0)) && !pos.claimed && (
            <button className="pp-btn mt-2 w-full" disabled={tx.busy} onClick={() => tx.run("claim", [m.id])}>[CLAIM {m.status === "FINALIZED" ? pts(pos.claimable) + " PTS" : "PAYOUT"}]</button>
          )}
        </div>
      )}
      <TxOut tx={tx} />
    </div>
  );
}

export function MarketDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const { data: m, error } = useMarket(id);
  const now = useNow(1000);
  if (error) return <div className="font-mono text-[12px] text-[#FF4D4D]">ERR {(error as Error).message}</div>;
  if (!m) return <div className="blink-cursor font-mono text-[12px] text-[#8B9A92]">LOADING MARKET #{id}</div>;
  return (
    <div className="space-y-4">
      <button onClick={onBack} className="font-mono text-[11px] text-[#8B9A92] hover:text-[#00FF9A]">&lt; ESC // BACK TO MARKETS</button>
      <section className="border border-[#1C2620] bg-[#0F1612] p-3 sm:p-4">
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-[#8B9A92]">
          <span>MKT #{m.id}</span><span>·</span><span>{m.category}</span><span>·</span><StatusTag status={m.status} />
          {m.outcome && <><span>·</span><span>OUTCOME</span><OutcomeTag outcome={m.outcome} /></>}
        </div>
        <h1 className="mt-2 text-[20px] font-semibold leading-snug text-[#D7E0DA] sm:text-[24px]">{m.question}</h1>
        <p className="mt-2 font-mono text-[11.5px] leading-5 text-[#8B9A92]"><span className="text-[#F5A623]">CRITERIA</span> {m.criteria}</p>
        <div className="mt-3 flex items-center gap-3 font-mono text-[12px]">
          <span className="whitespace-nowrap text-[#00FF9A]">YES {m.yes_pct}% · {pts(m.yes_total)}</span>
          <OddsBar yesPct={m.yes_pct} wide />
          <span className="whitespace-nowrap text-[#FF4D4D]">{pts(m.no_total)} · NO {100 - m.yes_pct}%</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-px bg-[#1C2620] font-mono text-[10px] sm:grid-cols-5">
          {[
            ["POOL", pts(m.pool)],
            ["STAKERS", m.stakers],
            ["DEADLINE", utc(m.deadline)],
            ["DISPUTE WINDOW", countdown(m.dispute_window)],
            ["CREATOR", shortAddress(m.creator)],
          ].map(([k, v]) => (
            <div key={k as string} className="bg-[#0F1612] px-2 py-1.5"><div className="text-[#8B9A92]">{k}</div><div className="text-[#D7E0DA]">{v}</div></div>
          ))}
        </div>
        <div className="mt-3 space-y-1 font-mono text-[11px]">
          <div className="text-[9px] tracking-[0.18em] text-[#8B9A92]">DECLARED SOURCES (FROZEN)</div>
          {m.sources.map((s, i) => (
            <a key={s} href={s} target="_blank" rel="noreferrer" className="flex items-center gap-2 truncate text-[#D7E0DA] hover:text-[#00FF9A]">
              <span className={m.trusted_sources[i] ? "text-[#00FF9A]" : "text-[#F5A623]"}>[{m.trusted_sources[i] ? "ALLOWLIST" : "AI-VETTED"}]</span>
              <span className="truncate">{s}</span>
            </a>
          ))}
        </div>
      </section>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.7fr)]">
        <Panel title="RESOLUTION // EVIDENCE LOG">
          <EvidenceLog m={m} />
        </Panel>
        <div className="space-y-4">
          {m.status === "OPEN" && <Panel title="ORDER_ENTRY // STAKE"><StakeForm m={m} /></Panel>}
          {m.status !== "INVALID" && <Panel title="SETTLEMENT // ACTIONS"><Actions m={m} now={now} /></Panel>}
        </div>
      </div>
    </div>
  );
}
