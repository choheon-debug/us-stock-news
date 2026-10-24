// POST /api/analyze {ticker, refresh?} → SSE로 진행 상태와 최종 결과를 보낸다.
import { analyze, useMock } from "@/lib/analyze";
import { AnalysisError } from "@/lib/claude";
import type { StreamEvent } from "@/lib/schema";

export const runtime = "nodejs";
export const maxDuration = 300;   // 실제 분석은 30~90초, 검색이 길면 더 걸릴 수 있다

const TICKER_RE = /^[\p{L}\p{N} .&'-]{1,40}$/u;

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const query = String(body?.ticker ?? "").trim();
  if (!query || !TICKER_RE.test(query)) return Response.json({ error: "티커나 회사명을 확인해 주세요." }, { status: 400 });

  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (e: StreamEvent) => controller.enqueue(enc.encode(`data: ${JSON.stringify(e)}\n\n`));
      // 오래 걸리는 동안 연결이 끊기지 않게 15초마다 빈 신호를 보낸다
      const ping = setInterval(() => controller.enqueue(enc.encode(": ping\n\n")), 15_000);
      try {
        const { data, cached } = await analyze(query, { refresh: body?.refresh === true, onStatus: message => send({ type: "status", message }) });
        send({ type: "result", data, cached, mock: useMock() });
      } catch (err) {
        console.error(err);
        send({ type: "error", message: err instanceof AnalysisError ? err.message : "분석 중 문제가 생겼어요. 잠시 뒤 다시 시도해 주세요." });
      } finally {
        clearInterval(ping);
        controller.close();
      }
    },
  });
  return new Response(stream, { headers: { "Content-Type": "text/event-stream; charset=utf-8", "Cache-Control": "no-cache, no-transform" } });
}
