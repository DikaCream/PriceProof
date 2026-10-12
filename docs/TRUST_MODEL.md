# PriceProof Trust Model

PriceProof is a prediction market where **the oracle is the validator set itself**. No price feed, committee or token vote decides the outcome. Instead, each GenLayer validator independently reads the public web pages the market creator declared, interprets a natural-language question against natural-language criteria, and must reach consensus with the other validators. This document covers who is trusted for what, what is enforced on-chain, and how the system fails.

## 1. Actors

| Actor | Can do | Cannot do |
|---|---|---|
| Creator (any wallet) | Propose a market: question, criteria, 1–3 sources, deadline, category, dispute window | Edit anything after creation; resolve their own market; pick validators |
| Staker (any wallet) | Claim 1000 points once, stake YES/NO before the deadline, dispute within the window (bond 100), claim payout | Stake after the deadline; dispute without a position |
| Anyone | Call `resolve`, `resolve_dispute`, `finalize` when their time comes | Influence the outcome: the caller has no say in what validators conclude |
| Validators | Fetch sources, run their own LLM, accept or reject the leader's result | Use sources that were not declared; accept a quote that is not on the cited page |
| Owner (deployer) | Toggle `strict_domains` (allowlist-only sources) for **future** markets | Touch existing markets, balances, outcomes or sources |

## 2. Market creation: what is fixed and checked

Deterministic rules (contract code, every node computes the same result):

- Question: 15–200 chars, must end with `?`. Criteria: 20–600 chars. Category from a fixed list.
- **1–3 source URLs**, `https://` only, ≤300 chars, no whitespace, quotes or credentials, no IP hosts, no `localhost`, no duplicates.
- **Blocked domains**: URL shorteners (bit.ly, t.co, tinyurl…) and social/user-generated platforms (x.com, twitter, facebook, instagram, tiktok, reddit, telegram, discord, youtube, medium, substack…). They can redirect or be edited by anyone.
- Optional **strict mode**: only allowlisted reputable domains (Wikipedia, Reuters, AP, BBC, ESPN, FIFA, NASA, CoinGecko…). The UI tags each source `[ALLOWLIST]` or `[AI-VETTED]`.
- Deadline 60 s – 366 days ahead; dispute window 60 s – 7 days (default 1 h).
- **Immutability**: question, criteria and sources are written once. No function can change them.

AI **validity check** (non-deterministic, consensus on a boolean): the leader's LLM decides `valid: true/false` and gives a reason. Every validator asks its own LLM, and consensus requires the **same boolean**. Rejected markets are stored with status `INVALID` and the reason, so rejections are public and auditable. Staking on them is impossible. The check rejects subjective, vague, non-binary or private-information questions, ambiguous criteria, and non-reputable sources.

## 3. Resolution: how validators reach consensus

`resolve(id)` can be called by anyone once `now ≥ deadline`.

1. **Leader**: fetches every declared source with `gl.nondet.web.render(url, mode="text")`, then prompts its LLM with the question, the frozen criteria, the deadline and the page texts (instructions inside pages are explicitly ignored). The output is `{outcome: YES|NO|UNRESOLVABLE, evidence_quote, source_url, reasoning}`.
2. **Sanitisation (deterministic)**: an unknown label becomes UNRESOLVABLE. A YES/NO answer with no declared `source_url` or a quote shorter than 8 normalised characters is downgraded to UNRESOLVABLE. "No evidence, no decision."
3. **Validators** (`gl.vm.run_nondet_unsafe` custom validator):
   - reject if the leader errored, returned an unknown label, or cited a URL that is not a declared source;
   - **re-fetch the cited source themselves** and reject if the leader's quote (lower-cased, alphanumerics only, whitespace-collapsed) is **not present on the page**, which catches hallucinated or fabricated evidence;
   - run the full resolution on their own fetches and accept **only if their outcome label equals the leader's**. Wording of quotes and reasoning may differ, but the label may not.
4. The result is stored as `PROPOSED` together with an **evidence round**: kind, outcome, quote, cited URL, reasoning, sources read, caller and timestamp. The dispute timer starts.

Deterministic tie and failure rules:

- All sources fail to load → UNRESOLVABLE (computed before any LLM call).
- Sources conflict, are ambiguous, or the event has not happened → the prompt requires UNRESOLVABLE.
- UNRESOLVABLE → every staker is refunded exactly what they staked.
- Winning side has zero stake → everyone is refunded.
- Validators disagree → the transaction fails (no state change) and anyone can retry `resolve`. GenLayer's appeal mechanism can also re-run it with a larger validator set.

## 4. Dispute window and bonds

- During `[proposed_at, proposed_at + window)`, any wallet **with a position** may call `dispute(id, reason, extra_source_url)` and bond **100 points**. Only one dispute is allowed per market, which keeps the outcome bounded and griefing cheap to absorb.
- The optional extra source must pass the same deterministic URL rules.
- `resolve_dispute(id)` (callable by anyone) runs a **stricter appeal round**: original sources plus the extra source, and a prompt that includes the proposed outcome, its evidence and the dispute reason. Validators must re-examine every source independently, may not trust the reason without source evidence, and keep the outcome unless the sources clearly support a different label. The same quote-on-page and same-label consensus rules apply.
- **Flipped**: the disputer gets the bond back plus a 100-point reward, the outcome changes, and the market is FINALIZED.
- **Upheld**: the bond is slashed into the market pool (paid to the winners), and the market is FINALIZED.
- With no dispute, after the window anyone can `finalize`, and `claim` auto-finalizes.

Payout (parimutuel, integer, deterministic): `stake_on_winner × (yes_total + no_total + slashed) ÷ winning_total`.

## 5. Failure modes and mitigations

| Risk | Mitigation | Residual risk |
|---|---|---|
| Creator picks a biased or editable source | Blocklist, AI reputability check, optional strict allowlist, sources visible before anyone stakes | A reputable page can still be wrong; stakers should read the sources |
| Source edited after the event (e.g. Wikipedia vandalism) | Quote must be on the live page for every validator; dispute + appeal re-reads; multiple sources | Coordinated edits at resolution time; use official pages where possible |
| Leader hallucinates evidence | Validators re-fetch the cited page and require the quote verbatim | — |
| Prompt injection inside a page | Prompt pins the question and criteria and tells the LLM to ignore page instructions; the outcome label must match across independently prompted validators | Pages served differently to different validators could cause disagreement (tx fails, retry) |
| LLM non-determinism | Consensus on the label only; ambiguity maps to UNRESOLVABLE (refund), never to a coin flip | Borderline questions may need several resolve attempts |
| Page unavailable / geo-blocked | Up to 3 sources; all down → UNRESOLVABLE refund | — |
| Frivolous disputes | 100-point bond, one dispute per market, stakers only | — |
| Market never resolved | Anyone can call `resolve` (it is gasless on Studionet) | A DISPUTED market whose appeal keeps failing consensus stays DISPUTED until a retry succeeds |
| Owner abuse | Owner can only toggle strict mode for new markets | — |

## 6. Why this needs GenLayer (vs Chainlink / UMA)

- **Chainlink** price and data feeds deliver numeric data that a node operator network has been configured to serve in advance. A long-tail question like "Did Argentina win the 2022 World Cup final on penalties?" has no feed, and building a custom job requires off-chain adapters and trusted operators.
- **UMA's optimistic oracle** resolves arbitrary questions, but correctness rests on human proposers, bonded disputers and a token-holder vote (DVM) that takes days and is economically gameable.
- **GenLayer** lets the contract itself say "read these three pages, interpret this natural-language rule, and only accept an answer whose evidence quote really appears on the page". Every validator does this independently, and consensus is reached on the *meaning* (the outcome label) rather than on byte-identical output: the equivalence principle. Resolution takes seconds, the evidence is on-chain, and the dispute path is another, stricter AI round, not a token vote.

This is the unconventional part: **subjective, natural-language resolution from live web evidence, decided by AI consensus, with an auditable evidence trail.**
