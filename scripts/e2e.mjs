// Real end-to-end run of PriceProof Markets on Studionet with two wallets.
// Wallet A = PRIVATE_KEY (deployer), wallet B = PRIVATE_KEY_2 (throwaway). Writes deployments/e2e-studionet.json.
import { readFileSync, writeFileSync } from "node:fs";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { getClient, toPlain, waitAndInspect, EXPLORER_URL } from "./lib.mjs";

const { contractAddress: address } = JSON.parse(readFileSync(new URL("../deployments/studionet.json", import.meta.url)));
const A = getClient();
if (!/^0x[0-9a-fA-F]{64}$/.test(process.env.PRIVATE_KEY_2 || "")) throw new Error("PRIVATE_KEY_2 missing in .env");
const B = createClient({ chain: studionet, endpoint: "https://studio.genlayer.com/api", account: createAccount(process.env.PRIVATE_KEY_2) });
const wallets = { A: A.account.address, B: B.account.address };
const steps = [];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const now = () => Math.floor(Date.now() / 1000);
const read = async (fn, args = []) => toPlain(await A.readContract({ address, functionName: fn, args }));

async function write(label, who, fn, args, { expectFail = false } = {}) {
  const c = who === "A" ? A : B;
  const t = Date.now();
  let hash, out;
  try {
    hash = await c.writeContract({ address, functionName: fn, args, value: 0n });
    out = await waitAndInspect(c, hash, { retries: 200, interval: 4000 });
  } catch (e) {
    out = { success: false, error: String(e.shortMessage || e.message).slice(0, 200) };
  }
  const row = {
    step: label, wallet: who, method: fn, tx: hash || null, explorer: hash ? `${EXPLORER_URL}/transactions/${hash}` : null,
    status: out.statusName || "REJECTED", execution: out.executionResult || "ERROR", ok: out.success === true,
    expected: expectFail ? "revert" : "success", seconds: Math.round((Date.now() - t) / 1000),
    error: out.success ? undefined : (out.stderr || out.error || out.returnValue || "").toString().slice(-240),
  };
  steps.push(row);
  console.log(`${row.ok ? "OK  " : "FAIL"} ${label} (${fn}) ${row.status}/${row.execution} ${row.seconds}s ${hash || ""}`);
  return row;
}
const save = (extra = {}) =>
  writeFileSync(new URL("../deployments/e2e-studionet.json", import.meta.url),
    JSON.stringify({ network: "studionet", contractAddress: address, explorer: `${EXPLORER_URL}/address/${address}`, wallets, ranAt: new Date().toISOString(), steps, ...extra }, null, 2) + "\n");

const WIKI22 = "https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_final";
const WIKI18 = "https://en.wikipedia.org/wiki/2018_FIFA_World_Cup_final";

// --- points
for (const w of ["A", "B"]) {
  const u = await read("get_user", [wallets[w]]);
  if (!u.claimed_start) await write(`claim starting points (${w})`, w, "claim_points", []);
}

// --- invalid markets
await write("deterministic rejection: URL shortener source", "A", "create_market",
  ["Did Argentina win the 2022 FIFA World Cup final?", "YES if the source states Argentina won the final, NO otherwise.", ["https://bit.ly/3xyz"], now() + 600, "SPORTS", 120, 3600], { expectFail: true });
const before = (await read("get_stats")).markets;
await write("AI validity check: subjective question", "A", "create_market",
  ["Is Lionel Messi the greatest footballer of all time?", "YES if Messi is the best player ever, NO otherwise, based on general opinion.", ["https://en.wikipedia.org/wiki/Lionel_Messi"], now() + 600, "SPORTS", 120, 3600]);
const invalid = await read("get_market", [before]);
console.log("invalid market:", invalid.status, invalid.invalid_reason);

// --- two valid markets: M1 (dispute path), M2 (no dispute, finalize after window)
const deadline = now() + 120;
const m1id = (await read("get_stats")).markets;
await write("create market M1 (Argentina 2022)", "A", "create_market",
  ["Did Argentina win the 2022 FIFA World Cup final?",
   "Resolves YES if the cited source states that Argentina won the 2022 FIFA World Cup final (including on penalties); NO if it states another team won.",
   [WIKI22], deadline, "SPORTS", 120, 3600]);
const m2id = m1id + 1;
await write("create market M2 (Croatia 2018, expect NO)", "A", "create_market",
  ["Did Croatia win the 2018 FIFA World Cup final?",
   "Resolves YES if the cited source states Croatia won the 2018 FIFA World Cup final; NO if it states another team won.",
   [WIKI18], deadline + 20, "SPORTS", 60, 3600]);
for (const id of [m1id, m2id]) {
  await write(`stake YES 300 on M${id - m1id + 1}`, "A", "stake", [id, "YES", 300]);
  await write(`stake NO 200 on M${id - m1id + 1}`, "B", "stake", [id, "NO", 200]);
}
save({ invalidMarket: invalid });
const wait = deadline + 25 - now();
if (wait > 0) { console.log(`waiting ${wait}s for deadlines`); await sleep(wait * 1000); }

await write("resolve M1 (AI validators read source)", "A", "resolve", [m1id]);
await write("resolve M2", "B", "resolve", [m2id]);
let m1 = await read("get_market", [m1id]);
console.log("M1 proposed:", m1.outcome);
const loser = m1.outcome === "YES" ? "B" : "A";
await write(`dispute M1 by ${loser} (bond 100)`, loser, "dispute",
  [m1id, "The proposed outcome contradicts the official final result; please re-check the scoreline and penalty shoot-out.", "https://www.bbc.com/sport/football/64062543"]);
await write("resolve_dispute M1 (appeal round)", "A", "resolve_dispute", [m1id]);

const m2 = await read("get_market", [m2id]);
const w2 = m2.dispute_ends - now() + 5;
if (w2 > 0) { console.log(`waiting ${w2}s for M2 dispute window`); await sleep(w2 * 1000); }
await write("finalize M2 after window", "B", "finalize", [m2id]);
for (const id of [m1id, m2id]) for (const w of ["A", "B"]) await write(`claim M${id - m1id + 1} (${w})`, w, "claim", [id]);

const result = {
  invalidMarket: invalid,
  markets: { M1: await read("get_market", [m1id]), M2: await read("get_market", [m2id]) },
  evidence: { M1: await read("get_evidence", [m1id]), M2: await read("get_evidence", [m2id]) },
  users: { A: await read("get_user", [wallets.A]), B: await read("get_user", [wallets.B]) },
  leaderboard: await read("get_leaderboard", [10]),
  stats: await read("get_stats"),
};
save(result);
console.log(JSON.stringify({ M1: result.markets.M1.outcome + "/" + result.markets.M1.dispute_result, M2: result.markets.M2.outcome, A: result.users.A.balance, B: result.users.B.balance }));
