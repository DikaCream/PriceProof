// Real Studionet e2e of the dispute-timeout path + a sanity resolve. Appends to deployments/e2e-studionet.json.
import { readFileSync, writeFileSync } from "node:fs";
import { createAccount, createClient } from "genlayer-js";
import { studionet } from "genlayer-js/chains";
import { getClient, toPlain, waitAndInspect, EXPLORER_URL } from "./lib.mjs";

const OUT = new URL("../deployments/e2e-studionet.json", import.meta.url);
const { contractAddress: address } = JSON.parse(readFileSync(new URL("../deployments/studionet.json", import.meta.url)));
const A = getClient();
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
  const row = { step: label, wallet: who, method: fn, tx: hash || null, explorer: hash ? `${EXPLORER_URL}/transactions/${hash}` : null,
    status: out.statusName || "REJECTED", execution: out.executionResult || "ERROR", ok: out.success === true,
    expected: expectFail ? "revert" : "success", seconds: Math.round((Date.now() - t) / 1000) };
  steps.push(row);
  console.log(`${row.ok ? "OK  " : "FAIL"} ${label} ${row.status}/${row.execution} ${row.seconds}s ${hash || ""}`);
  return row;
}

for (const w of ["A", "B"]) if (!(await read("get_user", [wallets[w]])).claimed_start) await write(`claim starting points (${w})`, w, "claim_points", []);
const deadline = now() + 100;
const T = (await read("get_stats")).markets;
await write("create T (timeout path; window 300s, timeout 60s)", "A", "create_market",
  ["Did Argentina win the 2022 FIFA World Cup final?", "Resolves YES if the cited source states that Argentina won the 2022 FIFA World Cup final (including on penalties); NO if it states another team won.",
   ["https://en.wikipedia.org/wiki/2022_FIFA_World_Cup_final"], deadline, "SPORTS", 300, 60]);
const S = T + 1;
await write("create S (sanity resolve)", "A", "create_market",
  ["Did Croatia win the 2018 FIFA World Cup final?", "Resolves YES if the cited source states Croatia won the 2018 FIFA World Cup final; NO if it states another team won.",
   ["https://en.wikipedia.org/wiki/2018_FIFA_World_Cup_final"], deadline + 15, "SPORTS", 60, 60]);
await write("stake YES 300 on T", "A", "stake", [T, "YES", 300]);
await write("stake NO 200 on T", "B", "stake", [T, "NO", 200]);
const w = deadline + 20 - now();
if (w > 0) { console.log(`waiting ${w}s`); await sleep(w * 1000); }
await write("resolve T", "A", "resolve", [T]);
await write("resolve S (sanity)", "B", "resolve", [S]);
await write("dispute T by B (bond 100)", "B", "dispute", [T, "Testing the timeout path: the appeal round is intentionally never run.", ""]);
await write("expire_dispute T too early (expect revert)", "A", "expire_dispute", [T], { expectFail: true });
const t = (await read("get_market", [T])).timeout_at - now() + 8;
if (t > 0) { console.log(`waiting ${t}s for dispute timeout`); await sleep(t * 1000); }
const balBBefore = (await read("get_user", [wallets.B])).balance;
await write("expire_dispute T after timeout", "A", "expire_dispute", [T]);
const balBAfterExpire = (await read("get_user", [wallets.B])).balance;
await write("claim refund T (A)", "A", "claim", [T]);
await write("claim refund T (B)", "B", "claim", [T]);

const run = {
  contractAddress: address, explorer: `${EXPLORER_URL}/address/${address}`, wallets, ranAt: new Date().toISOString(), steps,
  bondCheck: { B_before_expire: balBBefore, B_after_expire: balBAfterExpire, bond_returned: balBAfterExpire - balBBefore },
  markets: { T: await read("get_market", [T]), S: await read("get_market", [S]) },
  evidence: { T: await read("get_evidence", [T]), S: await read("get_evidence", [S]) },
  users: { A: await read("get_user", [wallets.A]), B: await read("get_user", [wallets.B]) },
};
const prev = JSON.parse(readFileSync(OUT));
const doc = prev.timeoutRun
  ? { ...prev, timeoutRun: run }
  : { note: "previousContract = full markets e2e on the earlier contract (before dispute timeout). timeoutRun = current contract.", currentContract: address, previousContract: prev, timeoutRun: run };
doc.currentContract = address;
writeFileSync(OUT, JSON.stringify(doc, null, 2) + "\n");
console.log(JSON.stringify({ T: run.markets.T.status, S: run.markets.S.outcome, bond: run.bondCheck, A: run.users.A.balance, B: run.users.B.balance }));
