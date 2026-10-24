"use client";
// 화면 전체: 티커 입력 → 서버 스트림(진행 상태) → 결과 리포트
import { useCallback, useEffect, useRef, useState } from "react";
import type { Analysis, StreamEvent } from "@/lib/schema";
import { ui } from "@/lib/ui-config";
import Report from "@/components/Report";

const RECENT_KEY = "usnews.recent";

function loadRecent(): string[] {
  try { return JSON.parse(localStorage.getItem(RECENT_KEY) || "[]"); } catch { return []; }
}
function saveRecent(list: string[]) {
  try { localStorage.setItem(RECENT_KEY, JSON.stringify(list)); } catch {}
}

type Result = { data: Analysis; cached: boolean; mock: boolean };

export default function StockApp() {
  const [input, setInput] = useState("");
  const [recent, setRecent] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [steps, setSteps] = useState<string[]>([]);
  const [elapsed, setElapsed] = useState(0);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { setRecent(loadRecent()); }, []);
  useEffect(() => {
    if (!busy) return;
    const t0 = Date.now(), id = setInterval(() => setElapsed(Math.round((Date.now() - t0) / 1000)), 1000);
    return () => clearInterval(id);
  }, [busy]);

  const run = useCallback(async (raw: string, refresh = false) => {
    const query = raw.trim();
    if (!query) return;
    abortRef.current?.abort();
    const ac = new AbortController();
    abortRef.current = ac;
    setBusy(true); setSteps([]); setElapsed(0); setError("");
    if (!refresh) setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker: query, refresh }), signal: ac.signal,
      });
      if (!res.ok || !res.body) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error || `요청이 실패했어요 (${res.status})`);
      }
      const reader = res.body.getReader(), dec = new TextDecoder();
      let buf = "";
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const chunks = buf.split("\n\n");
        buf = chunks.pop() ?? "";
        for (const c of chunks) {
          if (!c.startsWith("data: ")) continue;
          const e = JSON.parse(c.slice(6)) as StreamEvent;
          if (e.type === "status") setSteps(s => [...s, e.message]);
          else if (e.type === "error") setError(e.message);
          else {
            setResult({ data: e.data, cached: e.cached, mock: e.mock });
            if (!e.data.error) {
              const next = [e.data.ticker, ...loadRecent().filter(t => t !== e.data.ticker)].slice(0, ui.recent_tickers_max);
              saveRecent(next); setRecent(next);
              setInput(e.data.ticker);
            }
          }
        }
      }
    } catch (err) {
      if ((err as Error).name !== "AbortError") setError((err as Error).message || "알 수 없는 문제가 생겼어요.");
    } finally {
      if (abortRef.current === ac) setBusy(false);
    }
  }, []);

  const chips = (list: string[], tone: "quick" | "recent") => list.map(t => (
    <button key={t} type="button" disabled={busy} onClick={() => { setInput(t); run(t); }}
      className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-semibold transition disabled:opacity-50 ${tone === "quick"
        ? "bg-white text-slate-700 ring-1 ring-slate-200 active:bg-slate-100 dark:bg-slate-800 dark:text-slate-200 dark:ring-slate-700"
        : "bg-indigo-50 text-indigo-700 active:bg-indigo-100 dark:bg-indigo-950 dark:text-indigo-300"}`}>
      {t}
    </button>
  ));

  return (
    <main className="mx-auto max-w-2xl px-4 pb-16 pt-[max(env(safe-area-inset-top),1rem)]">
      <header className="mb-4 mt-2">
        <h1 className="text-2xl font-extrabold tracking-tight">📈 미증시뉴스</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">티커를 입력하면 최신 뉴스와 주가에 영향을 줄 이벤트를 정리해 드려요.</p>
      </header>

      <form onSubmit={e => { e.preventDefault(); run(input); }} className="flex gap-2">
        <input value={input} onChange={e => setInput(e.target.value)} placeholder="티커 또는 회사명 (예: NVDA)"
          autoCapitalize="characters" autoCorrect="off" spellCheck={false} enterKeyHint="search"
          className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-4 py-3 text-base font-semibold uppercase placeholder:font-normal placeholder:normal-case placeholder:text-slate-400 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 dark:border-slate-700 dark:bg-slate-900" />
        <button type="submit" disabled={busy || !input.trim()}
          className="rounded-xl bg-indigo-600 px-5 py-3 font-bold text-white shadow-sm active:bg-indigo-700 disabled:opacity-50">
          {busy ? "분석 중" : "분석하기"}
        </button>
      </form>

      <div className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]">{chips(ui.quick_tickers, "quick")}</div>
      {recent.length > 0 && (
        <div className="mt-2 flex items-center gap-2">
          <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">최근</span>
          <div className="-mr-4 flex gap-2 overflow-x-auto pb-1 pr-4 [scrollbar-width:none]">{chips(recent, "recent")}</div>
        </div>
      )}

      {busy && (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800" aria-live="polite">
          <div className="flex items-center gap-3">
            <span className="size-5 animate-spin rounded-full border-2 border-indigo-200 border-t-indigo-600" />
            <span className="font-semibold">{steps.at(-1) ?? "요청 보내는 중…"}</span>
            <span className="ml-auto text-sm tabular-nums text-slate-500">{elapsed}초</span>
          </div>
          <ol className="mt-3 space-y-1 text-sm text-slate-500 dark:text-slate-400">
            {steps.slice(0, -1).map((s, i) => <li key={i}>✓ {s.replace(/…$/, "")}</li>)}
          </ol>
          <p className="mt-3 text-xs text-slate-400">실제 분석은 30~90초 걸릴 수 있어요.</p>
        </section>
      )}

      {error && !busy && (
        <p className="mt-6 rounded-2xl bg-red-50 p-4 text-sm font-medium text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>
      )}

      {result && (
        <div className={busy ? "opacity-50" : ""}>
          <Report data={result.data} cached={result.cached} mock={result.mock} onRefresh={() => run(result.data.ticker, true)} busy={busy} />
        </div>
      )}

      {!result && !busy && !error && (
        <p className="mt-10 text-center text-sm text-slate-400">위 칩을 누르거나 티커를 입력해 보세요.</p>
      )}
    </main>
  );
}
