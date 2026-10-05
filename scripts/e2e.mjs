// Real end-to-end test of PriceProof on GenLayer Studionet.
// Updates BTC/ETH/SOL prices from the web under validator consensus, creates alerts
// (one that triggers immediately, one that must stay active, one that triggers on update),
// then verifies every view. Results: deployments/e2e-studionet.json
import { readFileSync, writeFileSync } from "node:fs";
import { getClient, waitAndInspect, parseReadable, toPlain, EXPLORER_URL } from "./lib.mjs";

const deployment = JSON.parse(readFileSync(new URL("../deployments/studionet.json", import.meta.url), "utf8"));
const address = process.env.CONTRACT_ADDRESS || deployment.contractAddress;
const client = getClient();
const me = client.account.address;
const steps = [];
const checks = [];

const read = async (functionName, args = []) => toPlain(await client.readContract({ address, functionName, args }));

async function write(label, functionName, args) {
  const started = Date.now();
  const hash = await client.writeContract({ address, functionName, args, value: 0n });
  console.log(`-> ${label}: ${hash}`);
  const o = await waitAndInspect(client, hash);
  const step = {
    step: label,
    method: functionName,
    args,
    hash,
    explorer: `${EXPLORER_URL}/transactions/${hash}`,
    status: o.statusName,
    consensus: o.consensusResult,
    execution: o.executionResult,
    success: o.success,
    seconds: Math.round((Date.now() - started) / 1000),
    result: parseReadable(o.returnValue),
    raw: o.returnValue,
  };
  console.log(`   ${step.status} / ${step.consensus} / ${step.execution} (${step.seconds}s) ${step.raw ?? ""}`.slice(0, 400));
  if (!o.success && o.stderr) console.log(`   stderr: ${String(o.stderr).slice(0, 400)}`);
  steps.push(step);
  return step;
}

function check(name, ok, detail = "") {
  checks.push({ name, ok: Boolean(ok), detail });
  console.log(`   [${ok ? "PASS" : "FAIL"}] ${name}${detail ? " - " + detail : ""}`);
}

async function referencePrice(pair) {
  try {
    const r = await fetch(`https://api.coinbase.com/v2/prices/${pair}/spot`);
    return Number((await r.json()).data.amount);
  } catch {
    return null;
  }
}

console.log(`Contract ${address} | wallet ${me}`);

for (const sym of ["BTC", "ETH"]) {
  const s = await write(`update_price ${sym}`, "update_price", [sym]);
  const ref = await referencePrice(`${sym}-USD`);
  const onchain = Number(s.result.price_e8 ?? 0) / 1e8;
  check(`${sym} price verified on-chain`, s.success && onchain > 0, `${onchain} USD via ${s.result.source}`);
  if (ref) check(`${sym} within 2% of Coinbase reference`, Math.abs(onchain - ref) / ref < 0.02, `ref ${ref}`);
}

const btc = await read("get_price", ["BTC"]);
const instant = await write("create_alert BTC above 1 (should trigger immediately)", "create_alert", ["BTC", "1", "above", "e2e: already met"]);
check("Immediate alert triggered on create", instant.result.status === "triggered" && instant.result.triggered_by === "create", `triggered at ${instant.result.triggered_price}`);

const never = await write("create_alert BTC above 10,000,000 (should stay active)", "create_alert", ["BTC", "10000000", "above", "e2e: far target"]);
check("Far alert stays active", never.result.status === "active");

const solPending = await write("create_alert SOL below 1,000,000 before SOL price exists", "create_alert", ["SOL", "1000000", "below", "e2e: trigger on update"]);
check("SOL alert active before any SOL price", solPending.result.status === "active");

const sol = await write("update_price SOL (should trigger the SOL alert)", "update_price", ["SOL"]);
const solAlert = await read("get_alert", [solPending.result.id]);
check("SOL alert triggered by update_price", solAlert.status === "triggered" && solAlert.triggered_by === "update", `at ${solAlert.triggered_price}`);

const recheck = await write("check_alert on the far BTC alert", "check_alert", [never.result.id]);
check("check_alert keeps far alert active", recheck.result.status === "active");

// views
const prices = await read("get_all_prices");
const history = await read("get_history", ["BTC", 10]);
const alerts = await read("get_alerts", [0, 20]);
const mine = await read("get_alerts_by_owner", [me]);
const stats = await read("get_stats");
const top = await read("get_top_updaters", [10]);
const config = await read("get_config");

check("get_all_prices lists BTC/ETH/SOL with prices", ["BTC", "ETH", "SOL"].every((s) => prices.find((p) => p.symbol === s)?.price_e8 > 0));
check("get_history(BTC) has the verified point", history.length >= 1 && history[0].price_e8 === btc.price_e8);
check("get_alerts returns 3 alerts newest first", alerts.length >= 3 && alerts[0].id > alerts[alerts.length - 1].id);
check("get_alerts_by_owner returns my alerts", mine.length >= 3 && mine.every((a) => a.owner.toLowerCase() === me.toLowerCase()));
check("get_stats counts", stats.updates >= 3 && stats.alerts >= 3 && stats.triggered >= 2 && stats.active >= 1, JSON.stringify(stats));
check("get_top_updaters includes deployer", top.some((r) => r.address.toLowerCase() === me.toLowerCase()));

const out = {
  network: "studionet",
  contractAddress: address,
  wallet: me,
  ranAt: new Date().toISOString(),
  steps: steps.map(({ raw, ...s }) => s),
  checks,
  views: { prices, history, alerts, stats, top, config },
  passed: checks.every((c) => c.ok) && steps.every((s) => s.success),
};
writeFileSync(new URL("../deployments/e2e-studionet.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(`\nE2E ${out.passed ? "PASSED" : "FAILED"} - ${checks.filter((c) => c.ok).length}/${checks.length} checks. Saved deployments/e2e-studionet.json`);
process.exit(out.passed ? 0 : 1);
