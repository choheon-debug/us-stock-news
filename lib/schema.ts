// data/analysis-schema.json을 zod로 옮긴 것. UI 렌더링과 서버 검증의 기준.
import { z } from "zod";

export const Sentiment = z.enum(["positive", "negative", "neutral"]);
export const Tone = z.enum(["positive", "negative", "neutral", "mixed"]);

export const AnalysisSchema = z.object({
  ticker: z.string(),
  resolved_from: z.string().nullish(),
  company: z.string(),
  exchange: z.enum(["NASDAQ", "NYSE", "NYSE American", "OTC", "기타"]).nullish(),
  sector: z.string().nullish(),
  country: z.string().nullish(),
  analyzed_at: z.object({ kst: z.string(), et: z.string() }),
  quote: z
    .object({
      price: z.number(),
      change_pct: z.number().nullish(),
      market_cap_usd: z.number().nullish(),
      week52_low: z.number().nullish(),
      week52_high: z.number().nullish(),
      volume: z.number().nullish(),
      prev_volume: z.number().nullish(),
      dollar_volume_usd: z.number().nullish(),
      as_of: z.string(),
      source: z.string(),
    })
    .nullish(),
  summary: z.object({
    tone: Tone,
    text: z.string(),
    move_explanation: z.string().nullish(),
  }),
  news: z
    .array(
      z.object({
        headline: z.string(),
        description: z.string(),
        source: z.string(),
        url: z.string().url().nullish(),
        date: z.string(),
        sentiment: Sentiment,
        category: z
          .enum(["earnings", "filing", "product", "regulatory", "listing", "offering", "analyst", "macro", "promotion", "other"])
          .nullish(),
      }),
    )
    .max(10),
  events: z.array(
    z.object({
      date: z.string(),
      title: z.string(),
      type: z.enum(["earnings", "product", "regulatory", "listing", "corporate_action", "offering", "macro", "other"]),
      status: z.enum(["past", "upcoming", "estimated"]),
      impact: z.string(),
    }),
  ),
  risks: z.array(
    z.object({
      kind: z.enum(["risk", "catalyst"]),
      category: z
        .enum(["dilution", "overhang", "listing", "reverse_split", "financial", "trading", "governance", "promotion", "jurisdiction", "business", "other"])
        .nullish(),
      title: z.string(),
      detail: z.string(),
      severity: z.enum(["high", "medium", "low"]),
    }),
  ),
  sources: z.array(z.object({ title: z.string(), url: z.string().url() })),
  error: z.string().nullish(),
});

export type Analysis = z.infer<typeof AnalysisSchema>;

/** 서버 → 브라우저 스트림(SSE) 이벤트 */
export type StreamEvent =
  | { type: "status"; message: string }
  | { type: "result"; data: Analysis; cached: boolean; mock: boolean }
  | { type: "error"; message: string };
