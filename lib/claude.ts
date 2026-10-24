// ② Claude API + web_search로 분석 → ③ zod 검증, 실패하면 구조화 출력으로 1회 다시 정리
import fs from "node:fs";
import path from "node:path";
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { AnalysisSchema, type Analysis } from "@/lib/schema";
import type { Context } from "@/lib/collectors";
import { nowStamps } from "@/lib/time";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5-5";
// 거절(refusal) 시 서버가 알아서 다른 모델로 이어 주는 기능을 쓰는 모델
const FALLBACK_MODELS = new Set(["claude-sonnet-5-5", "claude-opus-5-5", "claude-opus-5", "claude-fable-5-1"]);

// 시스템 프롬프트는 요청마다 같게 유지해서 프롬프트 캐시가 맞게 한다 (시각·티커는 user 메시지로)
const SYSTEM = `${fs.readFileSync(path.join(process.cwd(), "prompts", "analysis-system.md"), "utf8")}

## 출력 JSON 스키마 (data/analysis-schema.json)
\`\`\`json
${fs.readFileSync(path.join(process.cwd(), "data", "analysis-schema.json"), "utf8")}
\`\`\`

JSON은 \`\`\`json 코드 블록 하나로만 출력한다. analyzed_at, quote는 서버가 채우므로 대충 적어도 되지만, 서버 시세가 비어 있으면 검색으로 확인한 값을 출처와 함께 넣는다.`;

export class AnalysisError extends Error {}

let client: Anthropic | null = null;
const anthropic = () => (client ??= new Anthropic());

type Status = (message: string) => void;

export async function claudeAnalyze(query: string, ctx: Context, onStatus: Status): Promise<{ data: Analysis; citations: { title: string; url: string }[] }> {
  const now = nowStamps();
  const user = [
    `query: ${query}`,
    `now: KST ${now.kst} / ET ${now.et}`,
    `context (서버 수집 데이터, 비어 있을 수 있음):`,
    "```json",
    JSON.stringify({ resolved_ticker: ctx.ticker, company: ctx.company, quote: ctx.quote, sec_filings: ctx.filings, trading_halts_today: ctx.halts }, null, 1),
    "```",
  ].join("\n");

  const { text, citations } = await research(user, onStatus);
  onStatus("분석 정리 중…");
  let data = parseAnalysis(text);
  if (!data.ok) {
    onStatus("형식 다시 정리 중…");
    data = await repair(text, data.error);
  }
  if (!data.ok) throw new AnalysisError("분석 결과 형식이 맞지 않아요. 새로고침으로 다시 시도해 주세요.");
  return { data: data.value, citations };
}

/** 웹 검색을 하며 분석. pause_turn이면 이어서 요청한다. */
async function research(user: string, onStatus: Status) {
  const messages: Anthropic.Beta.BetaMessageParam[] = [{ role: "user", content: user }];
  let toolType: "web_search_20260209" | "web_search_20250305" = "web_search_20260209";
  let searches = 0;
  for (let round = 0; round < 4; round++) {
    let message: Anthropic.Beta.BetaMessage;
    try {
      const stream = anthropic().beta.messages.stream({
        model: MODEL,
        max_tokens: 32000,
        system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
        messages,
        tools: [{ type: toolType, name: "web_search", max_uses: 8 }],
        ...(FALLBACK_MODELS.has(MODEL) ? { betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" as const } : {}),
      });
      stream.on("streamEvent", e => {
        if (e.type === "content_block_start" && e.content_block.type === "server_tool_use") {
          searches++;
          onStatus(`뉴스·공시 검색 중… (${searches}회)`);
        }
      });
      message = await stream.finalMessage();
    } catch (err) {
      // 동적 필터링 버전 웹 검색을 못 쓰는 모델이면 기본 버전으로 한 번 더
      if (err instanceof Anthropic.BadRequestError && toolType === "web_search_20260209" && /web_search/.test(err.message)) {
        toolType = "web_search_20250305"; round--; continue;
      }
      throw toKorean(err);
    }
    if (message.stop_reason === "refusal") throw new AnalysisError("이 종목은 분석할 수 없다는 응답을 받았어요.");
    if (message.stop_reason === "pause_turn") {   // 검색이 길어져 잠시 멈춤 → 그대로 이어서
      messages.push({ role: "assistant", content: message.content });
      continue;
    }
    return { text: collectText(message), citations: collectCitations(message) };
  }
  throw new AnalysisError("검색이 너무 길어져 멈췄어요. 잠시 뒤 다시 시도해 주세요.");
}

function collectText(m: Anthropic.Beta.BetaMessage) {
  return m.content.filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text").map(b => b.text).join("");
}

/** 응답의 인용(출처 URL)을 버리지 않고 모은다 */
function collectCitations(m: Anthropic.Beta.BetaMessage) {
  const seen = new Map<string, string>();
  for (const b of m.content) {
    if (b.type === "text") {
      for (const c of b.citations ?? []) {
        if (c.type === "web_search_result_location" && !seen.has(c.url)) seen.set(c.url, c.title ?? c.url);
      }
    }
  }
  return [...seen].map(([url, title]) => ({ title, url }));
}

type Parsed = { ok: true; value: Analysis } | { ok: false; error: string };

function parseAnalysis(text: string): Parsed {
  const block = text.match(/```(?:json)?\s*([\s\S]*?)```/)?.[1] ?? text.slice(text.indexOf("{"), text.lastIndexOf("}") + 1);
  let raw: unknown;
  try { raw = JSON.parse(block); } catch (e) { return { ok: false, error: `JSON 파싱 실패: ${(e as Error).message}` }; }
  const r = AnalysisSchema.safeParse(raw);
  return r.success ? { ok: true, value: r.data } : { ok: false, error: r.error.message.slice(0, 2000) };
}

/** 검색 없이, 구조화 출력으로 스키마에 맞게 다시 정리 (1회) */
async function repair(text: string, error: string): Promise<Parsed> {
  try {
    const res = await anthropic().messages.parse({
      model: MODEL,
      max_tokens: 16000,
      messages: [{
        role: "user",
        content: `아래 분석 내용을 스키마에 맞는 JSON으로 다시 정리해 주세요. 내용은 바꾸거나 지어내지 말고, 없는 값은 null로 두세요.\n\n검증 오류:\n${error}\n\n분석 내용:\n${text}`,
      }],
      output_config: { format: zodOutputFormat(AnalysisSchema) },
    });
    const r = AnalysisSchema.safeParse(res.parsed_output);
    return r.success ? { ok: true, value: r.data } : { ok: false, error: r.error.message };
  } catch (err) {
    throw toKorean(err);
  }
}

function toKorean(err: unknown): Error {
  if (err instanceof AnalysisError) return err;
  console.error(err);
  if (err instanceof Anthropic.AuthenticationError) return new AnalysisError("API 키가 맞지 않아요. Vercel의 ANTHROPIC_API_KEY를 확인해 주세요.");
  if (err instanceof Anthropic.PermissionDeniedError) return new AnalysisError("이 API 키로는 웹 검색을 쓸 수 없어요. Console 설정 → 기능에서 웹 검색을 켜 주세요.");
  if (err instanceof Anthropic.RateLimitError) return new AnalysisError("요청이 많아 잠시 막혔어요. 1분 뒤 다시 시도해 주세요.");
  if (err instanceof Anthropic.BadRequestError && /credit|balance/i.test(err.message)) return new AnalysisError("Anthropic 크레딧이 부족해요. Console에서 충전해 주세요.");
  if (err instanceof Anthropic.BadRequestError) return new AnalysisError(`요청이 거절됐어요: ${err.message.slice(0, 200)}`);
  if (err instanceof Anthropic.APIError) return new AnalysisError("AI 서버에 문제가 있어요. 잠시 뒤 다시 시도해 주세요.");
  return new AnalysisError("분석 중 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요.");
}
