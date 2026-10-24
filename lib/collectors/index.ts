// ① 결정적 데이터 수집: 병렬로, 하나가 실패해도 나머지는 계속.
import { findInSec, recentFilings, type Filing } from "./sec";
import { fetchQuote, type Quote } from "./quote";
import { fetchHalts, type Halt } from "./halts";

export type Context = {
  ticker: string | null;      // SEC 목록에서 확정된 티커 (못 찾으면 null → Claude가 해석)
  company: string | null;
  filings: Filing[];
  quote: Quote | null;
  halts: Halt[];
};

export async function collect(query: string): Promise<Context> {
  const sec = await findInSec(query);
  const ticker = sec?.ticker ?? (/^[A-Za-z.\-]{1,6}$/.test(query.trim()) ? query.trim().toUpperCase() : null);
  if (!ticker) return { ticker: null, company: null, filings: [], quote: null, halts: [] };
  const [filings, quote, halts] = await Promise.all([
    sec ? recentFilings(sec.cik_str) : Promise.resolve([]),
    fetchQuote(ticker),
    fetchHalts(ticker),
  ]);
  return { ticker: sec ? ticker : quote ? ticker : null, company: sec?.title ?? quote?.name ?? null, filings, quote, halts };
}
