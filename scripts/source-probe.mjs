// Proves the fallback price sources work from Studionet validators by adding two assets
// without a Coinbase pair (deployer only): DOGE (CoinGecko first, Kraken fallback) and
// LTC (Kraken only), then verifying their prices. Results: deployments/source-probe.json
import { readFileSync, writeFileSync } from "node:fs";
import { getClient, waitAndInspect, parseReadable, toPlain, EXPLORER_URL } from "./lib.mjs";

const { contractAddress: address } = JSON.parse(readFileSync(new URL("../deployments/studionet.json", import.meta.url), "utf8"));
const client = getClient();
const read = async (fn, args = []) => toPlain(await client.readContract({ address, functionName: fn, args }));
const results = [];

async function write(label, functionName, args) {
  const hash = await client.writeContract({ address, functionName, args, value: 0n });
  const o = await waitAndInspect(client, hash);
  const r = { label, hash, explorer: `${EXPLORER_URL}/transactions/${hash}`, status: o.statusName, execution: o.executionResult, success: o.success, result: parseReadable(o.returnValue) };
  console.log(`${label}: ${r.status}/${r.execution} ${o.returnValue ?? o.stderr ?? ""}`.slice(0, 300));
  results.push(r);
  return r;
}

const symbols = (await read("get_all_prices")).map((p) => p.symbol);
if (!symbols.includes("DOGE")) await write("add_asset DOGE (coingecko + kraken)", "add_asset", ["DOGE", "Dogecoin", "dogecoin", "", "XDGUSD"]);
if (!symbols.includes("LTC")) await write("add_asset LTC (kraken only)", "add_asset", ["LTC", "Litecoin", "", "", "LTCUSD"]);
const doge = await write("update_price DOGE", "update_price", ["DOGE"]);
const ltc = await write("update_price LTC", "update_price", ["LTC"]);
const out = {
  contractAddress: address,
  ranAt: new Date().toISOString(),
  results,
  coingeckoWorks: doge.success && doge.result.source === "coingecko",
  krakenWorks: ltc.success && ltc.result.source === "kraken",
};
writeFileSync(new URL("../deployments/source-probe.json", import.meta.url), JSON.stringify(out, null, 2) + "\n");
console.log(`CoinGecko from validators: ${out.coingeckoWorks} (source=${doge.result.source}) | Kraken: ${out.krakenWorks} (source=${ltc.result.source})`);
