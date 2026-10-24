// SEC EDGAR: 티커 → CIK, 최근 공시 목록. 희석·오버행·상장 이슈의 1차 출처.
import { getJson } from "./http";

const UA = () => ({ "User-Agent": process.env.SEC_USER_AGENT || "us-stock-news contact@example.com" });

type TickerRow = { cik_str: number; ticker: string; title: string };
let tickers: { at: number; rows: TickerRow[] } | null = null;

/** SEC 전체 티커 목록 (하루 동안 메모리에 보관) */
export async function secTickers(): Promise<TickerRow[]> {
  if (tickers && Date.now() - tickers.at < 86_400_000) return tickers.rows;
  const j = await getJson<Record<string, TickerRow>>("https://www.sec.gov/files/company_tickers.json", UA());
  if (!j) return tickers?.rows ?? [];
  tickers = { at: Date.now(), rows: Object.values(j) };
  return tickers.rows;
}

/** 입력(티커·회사명)을 SEC 목록에서 찾는다. 정확한 티커 → 회사명 시작 일치 순 */
export async function findInSec(query: string): Promise<TickerRow | null> {
  const rows = await secTickers();
  const q = query.trim().toUpperCase();
  return rows.find(r => r.ticker.toUpperCase() === q)
    ?? (q.length >= 3 ? rows.find(r => r.title.toUpperCase().startsWith(q)) : undefined)
    ?? null;
}

export type Filing = { form: string; date: string; description: string; url: string };

/** 최근 공시 (최대 15건, 60일 이내 우선) */
export async function recentFilings(cik: number): Promise<Filing[]> {
  const cik10 = String(cik).padStart(10, "0");
  type Sub = { filings?: { recent?: { form: string[]; filingDate: string[]; accessionNumber: string[]; primaryDocument: string[]; primaryDocDescription: string[] } } };
  const j = await getJson<Sub>(`https://data.sec.gov/submissions/CIK${cik10}.json`, UA());
  const r = j?.filings?.recent;
  if (!r) return [];
  const since = new Date(Date.now() - 60 * 86_400_000).toISOString().slice(0, 10);
  const out: Filing[] = [];
  for (let i = 0; i < r.form.length && out.length < 15; i++) {
    if (r.filingDate[i] < since && out.length >= 5) break;
    const acc = r.accessionNumber[i].replace(/-/g, "");
    out.push({
      form: r.form[i], date: r.filingDate[i], description: r.primaryDocDescription[i] || "",
      url: `https://www.sec.gov/Archives/edgar/data/${cik}/${acc}/${r.primaryDocument[i]}`,
    });
  }
  return out;
}
