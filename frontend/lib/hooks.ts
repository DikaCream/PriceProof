"use client";

import { useCallback, useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CONTRACT_ADDRESS } from "./config";
import {
  getEvidence,
  getLeaderboard,
  getMarket,
  getMarkets,
  getPosition,
  getStats,
  getUser,
  sendTx,
  TxError,
  type TxResult,
} from "./priceproof";
import { getProvider } from "./wallet";
import { useWallet } from "./WalletProvider";

const enabled = !!CONTRACT_ADDRESS;

export const useMarkets = (status: string) =>
  useQuery({ queryKey: ["pp", "markets", status], queryFn: () => getMarkets(status, 0, 50), enabled, refetchInterval: 15_000 });

export const useMarket = (id: number | null) =>
  useQuery({ queryKey: ["pp", "market", id], queryFn: () => getMarket(id as number), enabled: enabled && id !== null, refetchInterval: 10_000 });

export const useEvidence = (id: number | null, rounds: number) =>
  useQuery({ queryKey: ["pp", "evidence", id, rounds], queryFn: () => getEvidence(id as number), enabled: enabled && id !== null && rounds > 0 });

export const usePosition = (id: number | null, user: string | null) =>
  useQuery({ queryKey: ["pp", "pos", id, user], queryFn: () => getPosition(id as number, user as string), enabled: enabled && id !== null && !!user });

export const useUser = (user: string | null) =>
  useQuery({ queryKey: ["pp", "user", user], queryFn: () => getUser(user as string), enabled: enabled && !!user, refetchInterval: 20_000 });

export const useStats = () => useQuery({ queryKey: ["pp", "stats"], queryFn: getStats, enabled, refetchInterval: 15_000 });

export const useLeaderboard = () =>
  useQuery({ queryKey: ["pp", "leaders"], queryFn: () => getLeaderboard(10), enabled, refetchInterval: 30_000 });

/** Re-renders every `ms` so countdowns stay live. */
export function useNow(ms = 1000): number {
  const [now, setNow] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const id = setInterval(() => setNow(Math.floor(Date.now() / 1000)), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
}

/** Runs one contract write with live consensus status; refreshes all queries afterwards. */
export function useTx() {
  const { address } = useWallet();
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<string | null>(null);
  const [hash, setHash] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const run = useCallback(
    async (functionName: string, args: unknown[]): Promise<TxResult | null> => {
      const provider = getProvider();
      if (!address || !provider) {
        setError("Connect MetaMask first");
        return null;
      }
      setBusy(true);
      setError(null);
      setHash(null);
      setStatus("SIGNING");
      try {
        return await sendTx(address, provider, functionName, args, { onHash: setHash, onStatus: setStatus });
      } catch (e: any) {
        if (e instanceof TxError && e.hash) setHash(e.hash);
        setError(friendlyError(e));
        return null;
      } finally {
        setBusy(false);
        queryClient.invalidateQueries({ queryKey: ["pp"] });
      }
    },
    [address, queryClient],
  );

  const reset = useCallback(() => {
    setStatus(null);
    setHash(null);
    setError(null);
  }, []);

  return { run, status, hash, error, busy, reset };
}

export function friendlyError(e: any): string {
  if (e?.code === 4001 || /user rejected|denied/i.test(e?.message ?? "")) {
    if (!(e instanceof TxError)) return "Transaction was rejected in your wallet";
  }
  return e?.shortMessage || e?.message || "Something went wrong";
}
