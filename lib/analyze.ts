// 분석 파이프라인: ① 공시·시세·거래정지 수집 → ② Claude + web_search → ③ zod 검증 → ④ 티커별 캐시
// ANTHROPIC_API_KEY가 없거나 USE_MOCK=1이면 목업 결과를 돌려준다 (화면에 "목업" 표시가 붙는다).
import { AnalysisSchema, type Analysis } from "@/lib/schema";
import { mockAnalysis } from "@/lib/mock";
import { collect } from "@/lib/collectors";
import { claudeAnalyze } from "@/lib/claude";
import { ui } from "@/lib/ui-config";
import { nowStamps } from "@/lib/time";

const TTL_MS = ui.cache_ttl_minutes * 60_000;
const cache = new Map<string, { at: number; data: Analysis }>();

export const useMock = () => process.env.USE_MOCK === "1" || !process.env.ANTHROPIC_API_KEY;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function analyze(query: string, { refresh = false, onStatus }: { refresh?: boolean; onStatus: (m: string) => void }) {
  const key = query.trim().toUpperCase();
  const hit = cache.get(key);
  if (!refresh && hit && Date.now() - hit.at < TTL_MS) return { data: hit.data, cached: true };

  const data = useMock() ? await mock(query, onStatus) : await real(query, onStatus);
  if (!data.error) {
    cache.set(key, { at: Date.now(), data });
    cache.set(data.ticker, { at: Date.now(), data });   // BIRD로 찾은 결과를 BIRK로도 재사용
  }
  return { data, cached: false };
}

async function mock(query: string, onStatus: (m: string) => void) {
  for (const m of ui.status_messages) { onStatus(m); await sleep(450); }
  return AnalysisSchema.parse(mockAnalysis(query));
}

async function real(query: string, onStatus: (m: string) => void): Promise<Analysis> {
  onStatus("종목 확인 중…");
  onStatus("공시·시세 확인 중…");
  const ctx = await collect(query);
  const { data, citations } = await claudeAnalyze(query, ctx, onStatus);
  if (data.error) return data;

  // 서버가 직접 받은 값이 검색값보다 우선 (시세·분석 시각)
  const q = ctx.quote;
  const quote = q && (!ctx.ticker || ctx.ticker === data.ticker)
    ? {
        price: q.price, change_pct: q.change_pct, volume: q.volume, prev_volume: q.prev_volume,
        dollar_volume_usd: q.dollar_volume_usd ?? data.quote?.dollar_volume_usd ?? null,
        market_cap_usd: q.market_cap_usd ?? data.quote?.market_cap_usd ?? null,
        week52_low: q.week52_low, week52_high: q.week52_high, as_of: q.as_of, source: q.source,
      }
    : data.quote;

  // 응답 인용 중 출처 목록에 빠진 것을 보탠다
  const known = new Set(data.sources.map(s => s.url));
  const sources = [...data.sources, ...citations.filter(c => !known.has(c.url))].slice(0, 20);

  const ticker = data.ticker.toUpperCase();
  // 대소문자만 다른 입력(knrx → KNRX)은 "해석했어요" 안내를 띄우지 않는다
  const resolved_from = data.resolved_from && data.resolved_from.trim().toUpperCase() !== ticker ? data.resolved_from : null;
  return AnalysisSchema.parse({ ...data, ticker, resolved_from, quote, sources, analyzed_at: nowStamps() });
}
