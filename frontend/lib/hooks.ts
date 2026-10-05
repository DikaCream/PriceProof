"use client";

import { useCallback, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CONTRACT_ADDRESS, HISTORY_POINTS } from "./config";
import {
  getAlerts,
  getAlertsByOwner,
  getAllPrices,
  getHistory,
  getStats,
  getTopUpdaters,
  sendTx,
  TxError,
  type TxResult,
} from "./priceproof";
import { getProvider } from "./wallet";
import { useWallet } from "./WalletProvider";

const enabled = !!CONTRACT_ADDRESS;

export const usePrices = () =>
  useQuery({ queryKey: ["pp", "prices"], queryFn: getAllPrices, enabled, refetchInterval: 15_000 });

export const useHistory = (symbol: string) =>
  useQuery({
    queryKey: ["pp", "history", symbol],
    queryFn: () => getHistory(symbol, HISTORY_POINTS),
    enabled,
    refetchInterval: 30_000,
  });

export const useAlerts = () =>
  useQuery({ queryKey: ["pp", "alerts"], queryFn: () => getAlerts(0, 50), enabled, refetchInterval: 15_000 });

export const useMyAlerts = (owner: string | null) =>
  useQuery({
    queryKey: ["pp", "alerts", "owner", owner],
    queryFn: () => getAlertsByOwner(owner as string),
    enabled: enabled && !!owner,
  });

export const useStats = () => useQuery({ queryKey: ["pp", "stats"], queryFn: getStats, enabled, refetchInterval: 15_000 });

export const useTopUpdaters = () =>
  useQuery({ queryKey: ["pp", "top"], queryFn: () => getTopUpdaters(10), enabled, refetchInterval: 30_000 });

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
