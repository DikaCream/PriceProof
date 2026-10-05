import { TOLERANCE_PCT } from "@/lib/config";

export function HowItWorks() {
  return (
    <section id="how" className="border border-[#1C2620] bg-[#0F1612] font-mono text-[12px] leading-6">
      <div className="border-b border-[#1C2620] px-3 py-2 text-[11px] tracking-[0.18em] text-[#8B9A92]">
        <span className="text-[#00FF9A]">MAN</span> // PRICEPROOF(1)
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap p-3 text-[#D7E0DA]">{`NAME
    priceproof — web-verified crypto price oracle on GenLayer

SYNOPSIS
    update_price(SYMBOL)   create_alert(SYM, TARGET, DIR, NOTE)
    check_alert(ID)        cancel_alert(ID)

DESCRIPTION
    PRICEPROOF lets Studionet validators each fetch a USD spot price
    from the open web. Consensus accepts the leader's price only when
    every validator is within ${TOLERANCE_PCT}% of that value.

PIPELINE
    1. REQUEST     Anyone calls update_price from MetaMask (gasless).
    2. LEADER      Reads Coinbase → CoinGecko → Kraken fallback chain.
    3. VALIDATE    Peers re-fetch independently; reject outliers.
    4. COMMIT      Store price, timestamp, source, updater + 48-pt tape.
    5. ALERTS      Matching on-chain orders fire when the tape crosses.

KEYS
    V     verify the selected instrument
    /     focus ORDER_ENTRY target field
    Esc   clear instrument selection

SEE ALSO
    GenLayer Studionet, MetaMask, explorer-studio.genlayer.com
`}</pre>
    </section>
  );
}
