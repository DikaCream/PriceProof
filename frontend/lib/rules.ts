// Client-side mirror of the contract's deterministic source/question rules (the contract is authoritative).
export const CATEGORIES = ["SPORTS", "POLITICS", "CRYPTO", "ECONOMY", "SCIENCE", "TECH", "CULTURE", "OTHER"];
export const BLOCKED = ["bit.ly", "tinyurl.com", "t.co", "goo.gl", "ow.ly", "is.gd", "buff.ly", "rebrand.ly", "cutt.ly", "shorturl.at", "tiny.cc", "x.com", "twitter.com", "facebook.com", "fb.com", "instagram.com", "tiktok.com", "reddit.com", "t.me", "telegram.me", "discord.com", "discord.gg", "youtube.com", "youtu.be", "linkedin.com", "threads.net", "pastebin.com", "medium.com", "substack.com"];
export const REPUTABLE = ["wikipedia.org", "bbc.com", "bbc.co.uk", "reuters.com", "apnews.com", "espn.com", "fifa.com", "uefa.com", "olympics.com", "nba.com", "formula1.com", "coingecko.com", "coinmarketcap.com", "nasa.gov", "who.int", "un.org", "europa.eu", "theguardian.com", "nytimes.com", "bloomberg.com", "ft.com", "cnn.com", "aljazeera.com", "nobelprize.org", "imdb.com", "github.com"];
const SUBJECTIVE = /\b(best|greatest|worst|good|bad|better|beautiful|deserve|should|overrated|underrated|favorite|favourite|likely|probably|cool|amazing)\b/i;

const inList = (h: string, list: string[]) => list.some((d) => h === d || h.endsWith("." + d));

export type Check = { level: "ok" | "warn" | "err"; msg: string };

export function checkUrl(raw: string): Check {
  const u = raw.trim();
  if (!u.startsWith("https://")) return { level: "err", msg: "https:// only" };
  if (u.length > 300 || /[\s"'<>\\]/.test(u)) return { level: "err", msg: "malformed URL" };
  const h = u.slice(8).split(/[/?#]/)[0].toLowerCase().replace(/^www\./, "");
  if (h.includes("@") || h.includes(":") || !h.includes(".")) return { level: "err", msg: "host not allowed" };
  if (/^[\d.]+$/.test(h)) return { level: "err", msg: "IP hosts not allowed" };
  if (inList(h, BLOCKED)) return { level: "err", msg: `${h}: shorteners/social blocked` };
  if (inList(h, REPUTABLE)) return { level: "ok", msg: `${h}: reputable allowlist` };
  return { level: "warn", msg: `${h}: not on allowlist — AI check will judge reputability` };
}

export function checkQuestion(q: string): Check[] {
  const out: Check[] = [];
  const t = q.trim();
  if (t.length < 15 || t.length > 200) out.push({ level: "err", msg: "question must be 15–200 chars" });
  if (!t.endsWith("?")) out.push({ level: "err", msg: "question must end with '?'" });
  if (t && !/^(will|did|does|is|was|has|have|are|were|can|do)\b/i.test(t)) out.push({ level: "warn", msg: "phrase as a YES/NO question (Will/Did/Is…)" });
  const m = t.match(SUBJECTIVE);
  if (m) out.push({ level: "warn", msg: `"${m[0]}" sounds subjective — likely rejected` });
  return out;
}

export function checkCriteria(c: string): Check[] {
  const t = c.trim();
  const out: Check[] = [];
  if (t.length < 20 || t.length > 600) out.push({ level: "err", msg: "criteria must be 20–600 chars" });
  if (t && !/\bYES\b/.test(t)) out.push({ level: "warn", msg: "state explicitly when it resolves YES" });
  return out;
}
