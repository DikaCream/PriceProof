# PriceProof

**PriceProof** is a web-verified crypto price oracle with on-chain price-target alerts, built on [GenLayer](https://genlayer.com) and deployed to **GenLayer Studionet**.

Anyone with a wallet can call `update_price(symbol)`. GenLayer validators each fetch the USD spot price from public APIs (Coinbase → CoinGecko → Kraken) and must agree within **1.5%**. The agreed price, timestamp, source and updater are stored with a bounded history. Alerts fire on-chain when a verified price crosses a target.

| | |
|---|---|
| Network | GenLayer Studionet (chain ID `61999`, RPC `https://studio.genlayer.com/api`) |
| Contract | [`0xb0e530cb15E92b2152C339955073a17A055dAD1F`](https://explorer-studio.genlayer.com/address/0xb0e530cb15E92b2152C339955073a17A055dAD1F) |
| Deploy tx | [`0xaa9698a6…a4b91d56`](https://explorer-studio.genlayer.com/transactions/0xaa9698a6bd27a0dfa2692e053fc68a8ca49c0fd8eb52649125fabfeaa4b91d56) |
| Frontend | Next.js (this repo's `frontend/`) |

> Studionet is a temporary hosted network and its state can be reset. If the contract above no longer exists, redeploy it (see [Deploy](#deploy)).

## Features

- **Web-verified prices.** `update_price` runs under `gl.vm.run_nondet_unsafe`: the leader fetches Coinbase / CoinGecko / Kraken; every validator re-fetches and accepts only within 1.5%.
- **Live consensus status.** The frontend streams the transaction's `statusName` (Pending → Proposing → Committing → Revealing → Accepted → Finalized).
- **Bounded history.** Up to 48 points per symbol (ring buffer) with a sparkline in the UI.
- **Price alerts.** Create above/below targets; they trigger on create (if already met), on every matching `update_price`, or via `check_alert`. Cancel your own alerts.
- **Top verifiers.** Leaderboard of wallets by update count.
- **Owner can add assets** (`add_asset`) with Coinbase / CoinGecko / Kraken ids.
- **Open Graph / Twitter card** via `next/og`.

## How it works

1. **Request.** Anyone calls `update_price("BTC")` from MetaMask (Studionet is gasless).
2. **Leader fetches.** Inside a non-deterministic block the leader hits Coinbase spot, falling back to CoinGecko, then Kraken.
3. **Validators verify.** Each validator fetches independently and agrees only if `|p_leader − p_validator| / max ≤ 1.5%`.
4. **Stored + alerts.** The agreed 1e8 fixed-point price, time, source and updater are written; matching active alerts fire.

Prices are stored as integers with **8 decimals** (e.g. `$85,627.985` → `8562798500000`).

## Contract API (`contracts/price_proof.py`)

| Method | Type | Description |
|---|---|---|
| `update_price(symbol)` | write | Fetch + consensus. Returns `{symbol, price_e8, price, source, timestamp, triggered}`. |
| `create_alert(symbol, target_price, direction, note)` | write | `target_price` is a decimal USD string; `direction` is `above`/`below`. May trigger immediately. |
| `check_alert(id)` / `cancel_alert(id)` | write | Re-evaluate against the latest verified price / owner-only cancel. |
| `add_asset(symbol, name, coingecko_id, coinbase_pair, kraken_pair)` | write | Deployer only. |
| `get_price(symbol)` / `get_all_prices()` | view | Latest verified price(s). |
| `get_history(symbol, limit)` | view | Newest first, up to 48. |
| `get_alerts(offset, limit)` / `get_alerts_by_owner(owner)` / `get_alert(id)` | view | Alert listings. |
| `get_stats()` / `get_top_updaters(limit)` / `get_config()` | view | Counters, leaderboard, tolerance/sources. |

Built-in assets: **BTC**, **ETH**, **SOL**. DOGE (CoinGecko) and LTC (Kraken) were added on Studionet during the source probe.

## Project structure

```
contracts/price_proof.py      Intelligent contract (GenVM)
tests/direct/                 Fast in-memory tests with mocked web responses
scripts/deploy.mjs            Deploy to Studionet
scripts/e2e.mjs               Real end-to-end on Studionet
scripts/source-probe.mjs      Proves CoinGecko + Kraken work from validators
scripts/lib.mjs               Shared helpers
deployments/                  Deployment + e2e records
frontend/                     Next.js 16 app (genlayer-js + MetaMask, Tailwind 4)
.github/workflows/ci.yml      CI: genvm-lint, direct tests, frontend build
docs/                         Screenshots
```

## Setup

Requirements: Node.js 20+, Python 3.12+, Git. Docker is **not** needed for Studionet.

```bash
git clone https://github.com/DikaCream/PriceProof.git
cd PriceProof
npm install
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### Lint and test the contract

```bash
genvm-lint check contracts/price_proof.py
pytest tests/direct/ -q                 # 19 direct-mode tests with mocked web responses
```

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs these checks plus the frontend build on every push to `main` and on pull requests.

## Deploy

```bash
npm run wallet:new          # creates a fresh wallet in .env (gitignored)
npm run deploy:studionet    # deploys contracts/price_proof.py
npm run e2e:studionet       # real e2e; writes deployments/e2e-studionet.json
```

Studionet is gasless. Resume an interrupted deploy with `node scripts/deploy.mjs --tx 0x...`.

### Latest end-to-end run (Studionet)

| Step | Result |
|---|---|
| `update_price("BTC")` | `$85,627.985` via Coinbase (within 2% of live Coinbase) |
| `update_price("ETH")` | `$2,700.795` via Coinbase |
| Alert BTC above `$1` | triggered on create |
| Alert BTC above `$10,000,000` | stays active |
| Alert SOL below `$1,000,000` (before SOL price) | active, then triggered by `update_price("SOL")` at `$120.355` |
| `check_alert` on the far BTC alert | still active |
| Views | prices, history, alerts, stats and top updaters all correct |

Source probe (assets without a Coinbase pair): DOGE priced via **CoinGecko** (`$0.09527`), LTC via **Kraken** (`$69.82`). All three sources work from Studionet validators.

## Run the frontend

```bash
cd frontend
cp .env.example .env.local      # skip if deploy:studionet already created it
npm install
npm run dev                     # http://localhost:3000
npm run build && npm start
```

`lib/priceproof.ts#sendTx` polls `getTransaction` every 2 s and streams `statusName` until the transaction is accepted.

## Security notes

- `.env` holds a private key and is gitignored. Never commit it.
- The frontend never handles private keys; all writes are signed in MetaMask.
- Price sources are public, unauthenticated HTTP APIs. Validators only agree within a tolerance, so a single poisoned source is not enough, but a widespread outage can leave a symbol stale.
- Rejected / failed consensus leaves state unchanged (`UNDETERMINED`).

## License

MIT
