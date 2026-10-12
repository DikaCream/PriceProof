"use client";

import { useLeaderboard, useTx, useUser } from "@/lib/hooks";
import { useWallet } from "@/lib/WalletProvider";
import { pts, sameAddress, shortAddress } from "@/lib/format";
import { START_POINTS } from "@/lib/config";
import { OutcomeTag, Panel, StatusTag } from "./ui";
import { TxSteps } from "./TxSteps";

export function Portfolio({ onOpen }: { onOpen: (id: number) => void }) {
  const { address } = useWallet();
  const { data: user } = useUser(address);
  const tx = useTx();
  return (
    <Panel title="PORTFOLIO // POINTS" right={<span className="font-mono text-[13px] tabular-nums text-[#00FF9A]">{user ? `${pts(user.balance)} PTS` : "—"}</span>}>
      <div className="p-3 font-mono text-[11px]">
        {!address && <div className="text-[#8B9A92]">Connect MetaMask to claim {START_POINTS} starting points and stake.</div>}
        {address && user && !user.claimed_start && (
          <button className="pp-btn w-full" disabled={tx.busy} onClick={() => tx.run("claim_points", [])}>[CLAIM {START_POINTS} STARTING POINTS]</button>
        )}
        <TxSteps status={tx.status} hash={tx.hash} />
        {tx.error && <div className="mt-2 text-[#FF4D4D]">ERR :: {tx.error}</div>}
        {user && user.positions.length > 0 && (
          <div className="mt-2 divide-y divide-[#1C2620] border border-[#1C2620]">
            {user.positions.map((p) => (
              <button key={p.market_id} onClick={() => onOpen(p.market_id)} className="block w-full px-2 py-1.5 text-left hover:bg-[#121A16]">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-[#D7E0DA]">#{p.market_id} {p.question}</span>
                  {p.status && <StatusTag status={p.status} />}
                </div>
                <div className="mt-0.5 flex gap-3 text-[10px]">
                  <span className="text-[#00FF9A]">Y {pts(p.yes)}</span>
                  <span className="text-[#FF4D4D]">N {pts(p.no)}</span>
                  {p.outcome && <span>→ <OutcomeTag outcome={p.outcome} /></span>}
                  {p.claimed ? <span className="text-[#8B9A92]">PAID {pts(p.payout)}</span> : p.claimable > 0 && <span className="text-[#F5A623]">CLAIMABLE {pts(p.claimable)}</span>}
                </div>
              </button>
            ))}
          </div>
        )}
        {user && user.claimed_start && user.positions.length === 0 && <div className="mt-2 text-[#8B9A92]">No positions yet. Pick an OPEN market.</div>}
      </div>
    </Panel>
  );
}

export function Leaderboard() {
  const { address } = useWallet();
  const { data = [] } = useLeaderboard();
  return (
    <Panel title="LEADERBOARD // POINTS">
      <ol className="font-mono text-[11px]">
        {data.length === 0 && <li className="px-3 py-3 text-[#8B9A92]">NO TRADERS YET</li>}
        {data.map((r, i) => (
          <li key={r.address} className={`flex items-center gap-3 border-b border-[#1C2620] px-3 py-1.5 last:border-0 ${sameAddress(r.address, address) ? "bg-[#121A16]" : ""}`}>
            <span className="w-5 text-right text-[#8B9A92]">{String(i + 1).padStart(2, "0")}</span>
            <span className="flex-1 text-[#D7E0DA]">{shortAddress(r.address)}{sameAddress(r.address, address) && <span className="text-[#00FF9A]"> (you)</span>}</span>
            <span className="text-[10px] text-[#8B9A92]">{r.markets} mkts</span>
            <span className="w-16 text-right tabular-nums text-[#00FF9A]">{pts(r.points)}</span>
          </li>
        ))}
      </ol>
    </Panel>
  );
}
