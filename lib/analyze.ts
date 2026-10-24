// 분석 파이프라인. 지금은 목업 단계: 진행 상태를 흉내 내고 목업 결과를 돌려준다.
// 다음 단계에서 ① 공시·시세 수집 → ② Claude + web_search → ③ zod 검증(실패 시 1회 재시도)로 바뀐다.
import { AnalysisSchema, type Analysis } from "@/lib/schema";
import { mockAnalysis } from "@/lib/mock";
import { ui } from "@/lib/ui-config";

const TTL_MS = ui.cache_ttl_minutes * 60_000;
const cache = new Map<string, { at: number; data: Analysis }>();

export const useMock = () => process.env.USE_MOCK === "1" || !process.env.ANTHROPIC_API_KEY;

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

export async function analyze(query: string, { refresh = false, onStatus }: { refresh?: boolean; onStatus: (m: string) => void }) {
  const key = query.trim().toUpperCase();
  const hit = cache.get(key);
  if (!refresh && hit && Date.now() - hit.at < TTL_MS) return { data: hit.data, cached: true };

  for (const m of ui.status_messages) { onStatus(m); await sleep(450); }
  const data = AnalysisSchema.parse(mockAnalysis(query));
  if (!data.error) cache.set(key, { at: Date.now(), data });
  return { data, cached: false };
}
