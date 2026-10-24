// 시세: Yahoo Finance 차트(비공식, 키 없음)로 가격·등락률·거래량·전일 거래량·52주 범위.
// Finnhub 키가 있으면 시가총액·회사명을 보탠다. 실패하면 null (Claude 검색값을 쓴다).
import { getJson } from "./http";

export type Quote = {
  price: number; change_pct: number | null; volume: number | null; prev_volume: number | null;
  dollar_volume_usd: number | null; market_cap_usd: number | null;
  week52_low: number | null; week52_high: number | null;
  as_of: string; source: string; exchange: string | null; name: string | null;
};

type Chart = { chart?: { result?: Array<{
  meta: { regularMarketPrice?: number; regularMarketVolume?: number; regularMarketTime?: number; fiftyTwoWeekHigh?: number; fiftyTwoWeekLow?: number; fullExchangeName?: string; longName?: string; shortName?: string };
  timestamp?: number[]; indicators?: { quote?: Array<{ close?: (number | null)[]; volume?: (number | null)[] }> };
}> } };

const etTime = (sec: number) =>
  `${new Intl.DateTimeFormat("sv-SE", { timeZone: "America/New_York", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(new Date(sec * 1000))} ET`;

export async function fetchQuote(ticker: string): Promise<Quote | null> {
  const j = await getJson<Chart>(
    `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?range=5d&interval=1d`,
    { "User-Agent": "Mozilla/5.0 (compatible; us-stock-news)" },
  );
  const r = j?.chart?.result?.[0];
  const m = r?.meta;
  if (!r || !m?.regularMarketPrice) return null;
  const q = r.indicators?.quote?.[0] ?? {};
  // 일봉 중 "오늘" 봉은 장 마감 직후 종가가 비어(null) 있을 수 있다. 종가로 거르면 하루씩 밀려
  // 이틀 전 종가와 비교하게 되므로, 날짜로 오늘 봉을 찾고 그 바로 앞 봉을 전일로 쓴다.
  const ts = r.timestamp ?? [];
  const etDate = (sec: number) => new Intl.DateTimeFormat("sv-SE", { timeZone: "America/New_York" }).format(new Date(sec * 1000));
  const today = m.regularMarketTime ? etDate(m.regularMarketTime) : null;
  let cur = ts.length - 1;
  if (today) { const i = ts.findLastIndex(t => etDate(t) === today); if (i >= 0) cur = i; }
  const prev = cur - 1;
  const price = m.regularMarketPrice;
  const volume = m.regularMarketVolume ?? q.volume?.[cur] ?? null;
  const prevClose = prev >= 0 ? q.close?.[prev] ?? null : null;
  const quote: Quote = {
    price,
    change_pct: prevClose ? ((price - prevClose) / prevClose) * 100 : null,
    volume,
    prev_volume: prev >= 0 ? q.volume?.[prev] ?? null : null,
    dollar_volume_usd: null,   // 정확한 거래대금은 없으므로 화면에서 가격×거래량으로 추정 표시
    market_cap_usd: null,
    week52_low: m.fiftyTwoWeekLow ?? null,
    week52_high: m.fiftyTwoWeekHigh ?? null,
    as_of: m.regularMarketTime ? etTime(m.regularMarketTime) : "",
    source: "Yahoo Finance",
    exchange: m.fullExchangeName ?? null,
    name: m.longName ?? m.shortName ?? null,
  };
  const key = process.env.FINNHUB_API_KEY;
  if (key) {
    const p = await getJson<{ marketCapitalization?: number; name?: string }>(
      `https://finnhub.io/api/v1/stock/profile2?symbol=${encodeURIComponent(ticker)}`, { "X-Finnhub-Token": key });
    if (p?.marketCapitalization) { quote.market_cap_usd = p.marketCapitalization * 1e6; quote.source += " · Finnhub"; }
    if (p?.name) quote.name = p.name;
  }
  return quote;
}
