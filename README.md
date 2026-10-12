# PriceProof

**PriceProof** runs **prediction markets on real-world events, resolved by GenLayer AI validators that read the web themselves**, with an on-chain evidence trail and a dispute window. It is deployed on **GenLayer Studionet**.

A creator freezes a YES/NO question, natural-language resolution criteria and 1–3 public source URLs. Stakers back YES or NO with non-monetary points. After the deadline, anyone calls `resolve`: every validator fetches the declared pages, asks its own LLM for `YES / NO / UNRESOLVABLE` with a **verbatim evidence quote**, and the network accepts the result only if validators agree on the label **and** the quote is really on the cited page. A dispute window follows, where a bonded dispute triggers a stricter appeal round. Then payouts are claimed.

| | |
|---|---|
| Live app | https://priceproof-eta.vercel.app |
| Network | GenLayer Studionet (chain `61999`, RPC `https://studio.genlayer.com/api`) |
| Contract | [`0x0e362036Aed7836F6C4Fc2220dFd20B6CbB7E06B`](https://explorer-studio.genlayer.com/address/0x0e362036Aed7836F6C4Fc2220dFd20B6CbB7E06B) (`contracts/priceproof_markets.py`) |
| Real e2e | [`deployments/e2e-studionet.json`](deployments/e2e-studionet.json) |
| Trust model | [`docs/TRUST_MODEL.md`](docs/TRUST_MODEL.md) |

> Studionet is a hosted test network and may be reset. Redeploy with `npm run deploy:studionet` if the address disappears.

## Why this is not a conventional oracle app

Price feeds answer "what number is on this API?". PriceProof answers questions like *"Did Argentina win the 2022 World Cup final?"* or *"Did the WHO declare X a public health emergency before June 1?"*. These are **natural-language questions resolved from natural-language web pages**, with judgement about what the text means. That only works on a chain whose validators can browse, read and reason, and that can reach consensus on *meaning* instead of identical bytes. On GenLayer, the contract itself is the oracle.

## Market lifecycle

```
create_market ──AI validity check──▶ OPEN ──deadline──▶ CLOSED ──resolve()──▶ PROPOSED
      │                                                                         │
      └──▶ INVALID (reason stored)                    dispute window ◀──────────┤
                                                       │ no dispute             │ dispute(bond)
                                                       ▼                        ▼
                                                  FINALIZED ◀──resolve_dispute()── DISPUTED
                                                       │                          │ timeout passed
                                                    claim()   ◀── refunds ── VOID_TIMEOUT (expire_dispute)
```

## Trust Model

Full write-up in [docs/TRUST_MODEL.md](docs/TRUST_MODEL.md). Summary:

**Who can create.** Any wallet. Creation is gated by deterministic rules plus an **AI validity check**: every validator's LLM judges whether the question is objective, binary, publicly verifiable and well-sourced. Consensus is on the boolean. Rejections are stored as `INVALID` with the reason, visible to everyone and unstakeable.

**Source rules (enforced in contract).** 1–3 `https://` URLs declared at creation and **immutable**. No IP hosts, credentials, whitespace or duplicates. **URL shorteners and social/user-generated sites are blocked** (bit.ly, t.co, x.com, reddit, tiktok, telegram, youtube, medium…). An optional **strict allowlist mode** accepts only reputable domains (Wikipedia, Reuters, AP, BBC, ESPN, FIFA, NASA, CoinGecko…). Resolution criteria are also frozen at creation.

**How validators reach consensus.** `resolve` uses `gl.vm.run_nondet_unsafe` with a custom validator:
1. The leader renders each source (`gl.nondet.web.render`) and returns `{outcome, evidence_quote, source_url, reasoning}`.
2. Each validator rejects if the cited URL is not a declared source, **re-fetches the cited page and rejects if the quote is not on it** (normalised substring match), then runs the whole resolution independently and accepts **only if its outcome label matches**.
3. Deterministic fallbacks: all sources down, conflicting or ambiguous evidence, or a YES/NO without a declared source plus quote → `UNRESOLVABLE` → full refund. No stake on the winning side → full refund.

**Evidence.** Every round (initial and appeal) is stored on-chain: outcome, verbatim quote, cited URL, reasoning, sources read, caller, timestamp (`get_evidence`). The UI renders it as a terminal log.

**Dispute window and bonds.** Each market sets its window (60 s – 7 days, default 1 h). Any staker can `dispute(id, reason, extra_source_url?)` by bonding **100 points**. `resolve_dispute` runs a stricter **appeal round** over the original sources plus the extra one, with the dispute reason and prior evidence in the prompt, under the same consensus rules. **Flipped** → bond back + 100 reward. **Upheld** → bond slashed into the winners' pool. One dispute per market, then FINALIZED. **Dispute timeout:** each market sets a timeout at creation (60 s – 7 days, UI default 24 h). If it is still DISPUTED after that, anyone calls `expire_dispute(id)`, and the market becomes `VOID_TIMEOUT`: all stakes are refundable via `claim`, the disputer's bond is returned in full, and a TIMEOUT entry is added to the evidence trail. A market can never be stuck.

**Failure modes.** Edited or vandalised source pages (mitigated by quote-on-page checks, multiple sources, disputes), prompt injection in pages (pinned prompt, label consensus across independent validators), LLM disagreement (tx fails, anyone retries; ambiguity resolves to refund rather than a coin flip; an appeal that never reaches consensus is voided by the dispute timeout), unavailable pages (UNRESOLVABLE refund). See the table in TRUST_MODEL.md.

**What GenLayer uniquely enables vs Chainlink / UMA.** Chainlink feeds serve pre-configured numeric data through operator networks, so there is no feed for long-tail natural-language events. UMA's optimistic oracle handles arbitrary questions but relies on human proposers and a multi-day token-holder vote. On GenLayer the contract tells validators *what to read and how to judge it*. Each validator independently browses and reasons, consensus is reached on meaning (the equivalence principle), resolution takes seconds, and the evidence trail lives on-chain.

## Contract API (`contracts/priceproof_markets.py`)

| Method | Kind | Notes |
|---|---|---|
| `claim_points()` | write | 1000 starting points, once per wallet |
| `create_market(question, resolution_criteria, source_urls[1-3], deadline_ts, category, dispute_window_s, dispute_timeout_s)` | write (nondet) | deterministic rules + AI validity check → `OPEN` or `INVALID` |
| `stake(id, "YES"\|"NO", amount)` | write | min 10 points, before the deadline |
| `resolve(id)` | write (nondet) | after the deadline → `PROPOSED` + evidence round |
| `dispute(id, reason, extra_source_url)` | write | stakers only, inside the window, 100-point bond |
| `resolve_dispute(id)` | write (nondet) | appeal round → `FINALIZED` (FLIPPED / UPHELD) |
| `expire_dispute(id)` | write | DISPUTED and timeout passed → `VOID_TIMEOUT`, refunds + bond back |
| `finalize(id)` / `claim(id)` | write | after the window; `claim` auto-finalizes; refunds on VOID_TIMEOUT |
| `get_markets(status, offset, limit)` | view | newest first, status `ALL/OPEN/CLOSED/PROPOSED/DISPUTED/FINALIZED/INVALID/VOID_TIMEOUT` |
| `get_market(id)`, `get_evidence(id)` | view | detail + all resolution rounds |
| `get_position(id, user)`, `get_user(user)` | view | positions, balance, claimable |
| `get_leaderboard(limit)`, `get_stats()`, `get_config()` | view | |

## Real end-to-end run on Studionet

Full lifecycle run (recorded under `previousContract` in the JSON; it ran on the contract before the timeout feature, `0xb0348dC3…C1f3`). `npm run e2e:studionet` uses two wallets (deployer + a throwaway `PRIVATE_KEY_2`). Results are in [`deployments/e2e-studionet.json`](deployments/e2e-studionet.json):

| # | Step | Wallet | Result | Tx |
|---|---|---|---|---|
| 1 | claim starting points (A) | A | ✅ ACCEPTED | [0x83a55dee…](https://explorer-studio.genlayer.com/transactions/0x83a55dee2f254d3a9cac2ec8e09b0460f62e266ad0bd6a26f1f0dfeb3a2633ca) |
| 2 | claim starting points (B) | B | ✅ ACCEPTED | [0x4f000277…](https://explorer-studio.genlayer.com/transactions/0x4f000277af00da1e7974fc8180a3fca0781271b947d02746cb31c8e972f7492d) |
| 3 | deterministic rejection: URL shortener source | A | ✅ reverted as expected (bit.ly blocked) | [0x1bcb1e32…](https://explorer-studio.genlayer.com/transactions/0x1bcb1e3292632fe9dedb36ae75022f75005ba0b7d6801161db9f677d7cd807be) |
| 4 | AI validity check: subjective question | A | ✅ ACCEPTED | [0x705c9a65…](https://explorer-studio.genlayer.com/transactions/0x705c9a65afbb0f4f663f42e862389eb7debb74d5c46187c085f0ee4e5d031293) |
| 5 | create market M1 (Argentina 2022) | A | ✅ ACCEPTED | [0xaf42db27…](https://explorer-studio.genlayer.com/transactions/0xaf42db270a2e2ce920b6196bef39a1529a64ee05403120bce1bed9c2b9c8405f) |
| 6 | create market M2 (Croatia 2018, expect NO) | A | ✅ ACCEPTED | [0xd4af3405…](https://explorer-studio.genlayer.com/transactions/0xd4af3405250e89152f3e63e49e35f3db33e7fc40144a028424f55fbc85469717) |
| 7 | stake YES 300 on M1 | A | ✅ ACCEPTED | [0x785802ee…](https://explorer-studio.genlayer.com/transactions/0x785802eed595f4b7db75de5434c5ab7b11d8e1ffa8bca7af25093b00fdc1b10b) |
| 8 | stake NO 200 on M1 | B | ✅ ACCEPTED | [0x8df1a00e…](https://explorer-studio.genlayer.com/transactions/0x8df1a00e4d021f4715371894f855bab1b26c5e45dd120b40566fe5aa73027ec7) |
| 9 | stake YES 300 on M2 | A | ✅ ACCEPTED | [0x35662785…](https://explorer-studio.genlayer.com/transactions/0x35662785cfcb55f0e1cb50cfcc0c804b3f2a10065620397bcf4e69d214636a24) |
| 10 | stake NO 200 on M2 | B | ✅ ACCEPTED | [0xbacdde0e…](https://explorer-studio.genlayer.com/transactions/0xbacdde0ece8ec43ad2981268cc14ba419154273206c16c4005965c1e50fe63a1) |
| 11 | resolve M1 (AI validators read source) | A | ✅ ACCEPTED | [0xc8294a6c…](https://explorer-studio.genlayer.com/transactions/0xc8294a6c1790772843ef891d735efecb37bef72e961413a67f79f0b7f47837a0) |
| 12 | resolve M2 | B | ✅ ACCEPTED | [0xcf07d0b0…](https://explorer-studio.genlayer.com/transactions/0xcf07d0b0abb58e2b571423e5bd259f998f67ebb030c4fd5b77e72422998ee736) |
| 13 | dispute M1 by B (bond 100) | B | ✅ ACCEPTED | [0xd6d361cc…](https://explorer-studio.genlayer.com/transactions/0xd6d361cc7512264557c9fb9d661913c76bc0ef104ed6f853473b1a9bc50d0ff6) |
| 14 | resolve_dispute M1 (appeal round) | A | ✅ ACCEPTED | [0x23dd46f3…](https://explorer-studio.genlayer.com/transactions/0x23dd46f3d66cf20781f38bc5e5205a8df178229e2a1e32bc73a29232d453823c) |
| 15 | finalize M2 after window | B | ✅ ACCEPTED | [0x906fb43e…](https://explorer-studio.genlayer.com/transactions/0x906fb43e1b1645f50d9ef156d6918c9e6785e98f0a83c19ff1d0027d14d11fad) |
| 16 | claim M1 (A) | A | ✅ ACCEPTED | [0xab9a14a5…](https://explorer-studio.genlayer.com/transactions/0xab9a14a58b8b1f8dd559584d497c8dd18c13934bac825460d69a53774c04735c) |
| 17 | claim M1 (B) | B | ✅ ACCEPTED | [0x1d397d36…](https://explorer-studio.genlayer.com/transactions/0x1d397d368c9e5ba8543c809e4f1a8bd6d5914e7cf2bf503c6196151e2602d9fa) |
| 18 | claim M2 (A) | A | ✅ ACCEPTED | [0x500cfbc1…](https://explorer-studio.genlayer.com/transactions/0x500cfbc15478847a55c316eeb0a59e51ac86dd22e69305883e0118b79a3efe94) |
| 19 | claim M2 (B) | B | ✅ ACCEPTED | [0x9a9ab674…](https://explorer-studio.genlayer.com/transactions/0x9a9ab674c44c0ab6faed4a70e4d53159e79b07c2552400fcabb38b4952144692) |

**Outcomes**
- AI validity check rejected *"Is Lionel Messi the greatest footballer of all time?"* → `INVALID`: "The question is purely subjective and the resolution criteria rely on 'general opinion', which is unverifiable and ambiguous."
- **M1** "Did Argentina win the 2022 FIFA World Cup final?" → initial round **YES**, quote: "Argentina won the ensuing penalty shoot-out 4–2 to win their third World Cup" ([source](https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_final)). The NO staker disputed with an extra BBC source → appeal round **YES** → dispute **UPHELD**, bond slashed into pool (600 pts). Payouts: A 600 / B 0.
- **M2** "Did Croatia win the 2018 FIFA World Cup final?" → **NO**, quote: "The final score was 4–2 to France.". No dispute → `finalize` after the 60 s window. Payouts: A 0 / B 500.
- Final balances: A 1000 pts, B 1000 pts.

### Dispute-timeout run (current contract)

`npm run e2e:timeout`: the appeal round is intentionally never run.

| # | Step | Wallet | Result | Tx |
|---|---|---|---|---|
| 1 | claim starting points (A) | A | ✅ ACCEPTED | [0x68926484…](https://explorer-studio.genlayer.com/transactions/0x68926484c82b22341cefec57131ef66f8ba0409d94e4a65e887496ff3b9e8b17) |
| 2 | claim starting points (B) | B | ✅ ACCEPTED | [0xb8ffc8e7…](https://explorer-studio.genlayer.com/transactions/0xb8ffc8e7427c24e7e0ffc4ae0ef1105c93b4b27cfc6f1694b84092fbeab5d9e6) |
| 3 | create T (timeout path; window 300s, timeout 60s) | A | ✅ ACCEPTED | [0x8870dce1…](https://explorer-studio.genlayer.com/transactions/0x8870dce1962c15f6c48fc83debfc0ac45307b2819a31915987a6368f4fcef87a) |
| 4 | create S (sanity resolve) | A | ✅ ACCEPTED | [0x58011d71…](https://explorer-studio.genlayer.com/transactions/0x58011d71f66e9b1be4afc0871ff5661c26de5c0bb3f6186daa064caab9f57f7b) |
| 5 | stake YES 300 on T | A | ✅ ACCEPTED | [0x64c00242…](https://explorer-studio.genlayer.com/transactions/0x64c0024291b621808f31ee0c88b3ffa53aa12bfae9488456af8fab620545205b) |
| 6 | stake NO 200 on T | B | ✅ ACCEPTED | [0xc7b57fb6…](https://explorer-studio.genlayer.com/transactions/0xc7b57fb6355e5de040eab64dd741b3d2d5e48ab499d3ef0ed9364dccbd974719) |
| 7 | resolve T | A | ✅ ACCEPTED | [0xb89b340b…](https://explorer-studio.genlayer.com/transactions/0xb89b340b82b7501508b282bede91e6a4a729c85f78e312b1a39e866e2211b714) |
| 8 | resolve S (sanity) | B | ✅ ACCEPTED | [0xd2d6c6b6…](https://explorer-studio.genlayer.com/transactions/0xd2d6c6b6e35a68c36cf51df2ddae03b586ecedd874d27f0d3da1c7fe34095552) |
| 9 | dispute T by B (bond 100) | B | ✅ ACCEPTED | [0xfc0152e1…](https://explorer-studio.genlayer.com/transactions/0xfc0152e1856453a6961eb60c2a8814424f73b5dc7006537be42c9530d984c6f0) |
| 10 | expire_dispute T too early (expect revert) | A | ✅ reverted as expected (timeout not reached) | [0xcfdf1c91…](https://explorer-studio.genlayer.com/transactions/0xcfdf1c9137d0068d1ff5b87a9bda5ccf17be5ac66e0dba95a6b311049f08ad7f) |
| 11 | expire_dispute T after timeout | A | ✅ ACCEPTED | [0xd5947480…](https://explorer-studio.genlayer.com/transactions/0xd5947480807cd90e45344fc029da994534ec8b10e52c8f54082d41f5ec41452e) |
| 12 | claim refund T (A) | A | ✅ ACCEPTED | [0x7fcd8cd2…](https://explorer-studio.genlayer.com/transactions/0x7fcd8cd2bd0d153defb4afea24ae4869d86de2027ab4fc8a66c53833092d89df) |
| 13 | claim refund T (B) | B | ✅ FINALIZED | [0x7b0add35…](https://explorer-studio.genlayer.com/transactions/0x7b0add35036a59720f695970ec115cb7f651dcb9b7671655acef610995278656) |

- **T** → `VOID_TIMEOUT` after the 60 s timeout. Evidence: `TIMEOUT` / Appeal round did not complete within 60s of the dispute; market voided, all stakes refundable, dispute bond returned.
- Disputer B's balance went from 700 to 800 on expiry (bond 100 returned). A was refunded 300 and B 200; final balances A 1000, B 1000.
- **S** sanity resolve → **NO** ("The final score was 4–2 to France.").


## Frontend

Next.js 16 + Tailwind 4 terminal UI (IBM Plex Mono/Sans, `#070B09` / `#00FF9A` / `#F5A623` / `#FF4D4D`): a markets ticker, status-filtered markets table (stacked on mobile), market detail with an order-entry stake form, resolution evidence log, dispute form with live countdown, create-market form with live validity feedback, portfolio/points and leaderboard. Keys: `1-8` filter, `N` new market, `Esc` back.

Screenshots: `docs/markets-desktop.png`, `docs/markets-mobile.png` (generated locally with headless Chrome).

## Development

```bash
python -m venv .venv && .venv/bin/pip install -r requirements.txt
genvm-lint check contracts/priceproof_markets.py
pytest tests/direct/ -q            # web + LLM mocked: create, invalid, staking, YES/NO/UNRESOLVABLE, disputes, payouts, refunds
npm install && npm run deploy:studionet
npm run e2e:studionet
cd frontend && npm ci && npm run dev
```

Secrets live only in `.env` (git-ignored). The frontend uses only `NEXT_PUBLIC_*` values.

## License

MIT
