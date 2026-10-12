"use client";

import { forwardRef, useImperativeHandle, useMemo, useRef, useState } from "react";
import { useTx } from "@/lib/hooks";
import { CATEGORIES, checkCriteria, checkQuestion, checkUrl, type Check } from "@/lib/rules";
import { Panel } from "./ui";
import { TxSteps } from "./TxSteps";

export type CreateHandle = { focus: () => void };

const COLOR = { ok: "text-[#00FF9A]", warn: "text-[#F5A623]", err: "text-[#FF4D4D]" };
const ICON = { ok: "✓", warn: "!", err: "✕" };

function Lines({ checks }: { checks: Check[] }) {
  return (
    <>
      {checks.map((c, i) => (
        <div key={i} className={`font-mono text-[10.5px] ${COLOR[c.level]}`}>{ICON[c.level]} {c.msg}</div>
      ))}
    </>
  );
}

export const CreateMarket = forwardRef<CreateHandle, { onCreated: (id: number) => void }>(function CreateMarket({ onCreated }, ref) {
  const qRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => ({ focus: () => qRef.current?.focus() }));
  const [q, setQ] = useState("");
  const [crit, setCrit] = useState("");
  const [urls, setUrls] = useState(["", "", ""]);
  const [cat, setCat] = useState("SPORTS");
  const [mins, setMins] = useState("60");
  const [win, setWin] = useState("60");
  const [tmo, setTmo] = useState("1440");
  const tx = useTx();
  const [result, setResult] = useState<{ status: string; reason: string; id: number } | null>(null);

  const srcs = urls.map((u) => u.trim()).filter(Boolean);
  const urlChecks = urls.map((u) => (u.trim() ? checkUrl(u) : null));
  const dup = new Set(srcs).size !== srcs.length;
  const all = useMemo(() => {
    const c = [...checkQuestion(q), ...checkCriteria(crit)];
    if (!srcs.length) c.push({ level: "err", msg: "at least 1 source URL" });
    if (dup) c.push({ level: "err", msg: "duplicate source" });
    const m = parseInt(mins || "0", 10);
    if (m < 2) c.push({ level: "err", msg: "deadline must be ≥ 2 min out" });
    const w = parseInt(win || "0", 10);
    if (w < 1 || w > 10080) c.push({ level: "err", msg: "dispute window 1 min – 7 days" });
    const t = parseInt(tmo || "0", 10);
    if (t < 1 || t > 10080) c.push({ level: "err", msg: "dispute timeout 1 min – 7 days" });
    return c;
  }, [q, crit, srcs.length, dup, mins, win, tmo]);
  const empty = !q.trim() && !crit.trim() && !srcs.length;
  const blocked = all.some((c) => c.level === "err") || urlChecks.some((c) => c?.level === "err");
  const score = empty ? "AWAITING INPUT" : blocked ? "BLOCKED" : all.some((c) => c.level === "warn") || urlChecks.some((c) => c?.level === "warn") ? "AT RISK" : "LIKELY VALID";

  async function submit() {
    setResult(null);
    const deadline = Math.floor(Date.now() / 1000) + parseInt(mins, 10) * 60;
    const res = await tx.run("create_market", [q.trim(), crit.trim(), srcs, deadline, cat, parseInt(win, 10) * 60, parseInt(tmo, 10) * 60]);
    if (res) {
      const v = res.values as Record<string, unknown>;
      const r = { status: String(v.status ?? ""), reason: String(v.invalid_reason ?? ""), id: Number(v.id ?? -1) };
      setResult(r);
      if (r.status === "OPEN" && r.id >= 0) onCreated(r.id);
    }
  }

  return (
    <Panel title="NEW_MARKET // CREATE" right={<span className={`font-mono text-[10px] ${score === "AWAITING INPUT" ? "text-[#8B9A92]" : score === "BLOCKED" ? "text-[#FF4D4D]" : score === "AT RISK" ? "text-[#F5A623]" : "text-[#00FF9A]"}`}>PRE-CHECK: {score}</span>}>
      <div className="space-y-3 p-3">
        <label className="block font-mono text-[10px] tracking-wider text-[#8B9A92]">
          QUESTION (YES/NO, OBJECTIVE)
          <input ref={qRef} className="pp-input mt-1" placeholder="Did Argentina win the 2022 FIFA World Cup final?" value={q} onChange={(e) => setQ(e.target.value)} />
        </label>
        <label className="block font-mono text-[10px] tracking-wider text-[#8B9A92]">
          RESOLUTION CRITERIA (FROZEN AT CREATION)
          <textarea className="pp-input mt-1 h-16 resize-none" placeholder="Resolves YES if the cited source states … ; NO if …" value={crit} onChange={(e) => setCrit(e.target.value)} />
        </label>
        <div className="space-y-1">
          <div className="font-mono text-[10px] tracking-wider text-[#8B9A92]">SOURCES (1–3 HTTPS, IMMUTABLE)</div>
          {urls.map((u, i) => (
            <div key={i}>
              <input className="pp-input" placeholder={i === 0 ? "https://en.wikipedia.org/wiki/…" : "optional"} value={u} onChange={(e) => setUrls(urls.map((x, j) => (j === i ? e.target.value : x)))} />
              {urlChecks[i] && <Lines checks={[urlChecks[i] as Check]} />}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <label className="font-mono text-[10px] text-[#8B9A92]">CATEGORY
            <select className="pp-select mt-1 w-full" value={cat} onChange={(e) => setCat(e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </label>
          <label className="font-mono text-[10px] text-[#8B9A92]">DEADLINE (MIN)
            <input className="pp-input mt-1" inputMode="numeric" value={mins} onChange={(e) => setMins(e.target.value.replace(/\D/g, ""))} />
          </label>
          <label className="font-mono text-[10px] text-[#8B9A92]">DISPUTE (MIN)
            <input className="pp-input mt-1" inputMode="numeric" value={win} onChange={(e) => setWin(e.target.value.replace(/\D/g, ""))} />
          </label>
          <label className="font-mono text-[10px] text-[#8B9A92]">TIMEOUT (MIN)
            <input className="pp-input mt-1" inputMode="numeric" value={tmo} onChange={(e) => setTmo(e.target.value.replace(/\D/g, ""))} />
          </label>
        </div>
        <div className="border border-[#1C2620] bg-[#070B09] px-2 py-1.5">
          <div className="mb-0.5 font-mono text-[9px] tracking-[0.18em] text-[#8B9A92]">LIVE VALIDITY FEEDBACK</div>
          {empty ? <div className="font-mono text-[10.5px] text-[#8B9A92]">&gt; type a question — rules are checked as you type<span className="blink-cursor" /></div> : all.length ? <Lines checks={all} /> : <Lines checks={[{ level: "ok", msg: "local rules pass — AI validators make the final call on-chain" }]} />}
        </div>
        <button className="pp-btn w-full" disabled={tx.busy || blocked} onClick={submit}>[SUBMIT — RUN AI VALIDITY CHECK]</button>
        <TxSteps status={tx.status} hash={tx.hash} />
        {tx.error && <div className="border border-[#FF4D4D]/40 px-2 py-1.5 font-mono text-[11px] text-[#FF4D4D]">ERR :: {tx.error}</div>}
        {result && (
          <div className={`border px-2 py-1.5 font-mono text-[11px] ${result.status === "INVALID" ? "border-[#FF4D4D]/40 text-[#FF4D4D]" : "border-[#00FF9A]/40 text-[#00FF9A]"}`}>
            {result.status === "INVALID" ? `REJECTED BY VALIDATORS :: ${result.reason}` : `MARKET #${result.id} OPEN`}
          </div>
        )}
      </div>
    </Panel>
  );
});
