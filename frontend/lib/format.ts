export function shortAddress(address: string): string {
  return address.length > 12 ? `${address.slice(0, 6)}…${address.slice(-4)}` : address;
}

export const sameAddress = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

export function timeAgo(unixSeconds: number): string {
  if (!unixSeconds) return "never";
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 86400 * 30) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(unixSeconds * 1000).toLocaleDateString();
}

/** fresh: < 15 min, aging: < 2 h, stale: older or never verified. */
export function freshness(unixSeconds: number): "fresh" | "aging" | "stale" {
  if (!unixSeconds) return "stale";
  const diff = Date.now() / 1000 - unixSeconds;
  return diff < 900 ? "fresh" : diff < 7200 ? "aging" : "stale";
}

/** Formats a 1e8 fixed-point USD price. */
export function usd(priceE8: number): string {
  const v = priceE8 / 1e8;
  if (!v) return "-";
  const digits = v >= 1000 ? 2 : v >= 1 ? 3 : v >= 0.01 ? 5 : 8;
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: v >= 1000 ? 2 : 2,
    maximumFractionDigits: digits,
  });
}

export function pctChange(from: number, to: number): number | null {
  if (!from || !to) return null;
  return ((to - from) / from) * 100;
}
