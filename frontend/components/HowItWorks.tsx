export function HowItWorks() {
  const g = "text-[#00FF9A]";
  const a = "text-[#F5A623]";
  return (
    <section className="border border-[#1C2620] bg-[#0F1612]">
      <div className="border-b border-[#1C2620] px-3 py-2 font-mono text-[10px] tracking-[0.22em] text-[#00FF9A]">MAN // PRICEPROOF(1) — TRUST MODEL</div>
      <pre className="overflow-x-auto whitespace-pre-wrap px-3 py-3 font-mono text-[11.5px] leading-[1.65] text-[#8B9A92]">
<span className={g}>NAME</span>{"\n"}    priceproof — YES/NO markets on real-world events, resolved by GenLayer AI validators from the open web.{"\n\n"}
<span className={g}>LIFECYCLE</span>{"\n"}    OPEN → (deadline) CLOSED → resolve() PROPOSED → dispute window → FINALIZED → claim(){"\n"}    PROPOSED → dispute() DISPUTED → resolve_dispute() appeal round → FINALIZED{"\n\n"}
<span className={g}>SOURCES</span>{"\n"}    1–3 https URLs declared at creation, frozen forever. Shorteners, social media, IPs blocked.{"\n"}    Criteria are frozen too: validators apply them literally.{"\n\n"}
<span className={g}>VALIDITY CHECK</span>{"\n"}    On create, every validator asks its own LLM whether the question is objective, binary and{"\n"}    sourced from reputable public pages. They must agree on the boolean. Rejects are stored as INVALID.{"\n\n"}
<span className={g}>RESOLUTION</span>{"\n"}    Each validator fetches the sources itself and returns YES / NO / UNRESOLVABLE + a verbatim quote.{"\n"}    Consensus = same outcome label AND the leader&apos;s quote must appear on the cited page.{"\n"}    No source, conflicting sources, or no verbatim quote → UNRESOLVABLE → full refund.{"\n\n"}
<span className={a}>DISPUTES</span>{"\n"}    Any staker may bond 100 pts inside the window (+ optional extra source). A stricter appeal round{"\n"}    re-reads all sources. Flipped → bond back + 100 reward. Upheld → bond slashed into winners&apos; pool.{"\n"}    No successful appeal before the per-market timeout (default 24h) → expire_dispute(): VOID_TIMEOUT,{"\n"}    every stake refunded, bond returned in full.{"\n\n"}
<span className={g}>POINTS</span>{"\n"}    1000 starting points per wallet, claim once. Parimutuel payout. No monetary value (Studionet).
      </pre>
    </section>
  );
}
