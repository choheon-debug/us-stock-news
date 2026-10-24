// 분석 결과 리포트: 헤더 → 종합 전망 → 최신 뉴스 → 이벤트 캘린더 → 리스크/촉매 → 출처·면책
import type { CSSProperties, ReactNode } from "react";
import type { Analysis } from "@/lib/schema";
import { ui, type EventTypeKey, type SentimentKey, type SeverityKey } from "@/lib/ui-config";
import { fmtStamp } from "@/lib/time";
import sources from "@/data/sources.json";

type Props = { data: Analysis; cached: boolean; mock: boolean; busy: boolean; onRefresh: () => void };

const card = "mt-4 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-200 dark:bg-slate-900 dark:ring-slate-800 sm:p-5";
const h2 = "mb-3 text-base font-bold";

function Badge({ kind }: { kind: SentimentKey }) {
  const s = ui.sentiment[kind];
  const style = { "--bg": s.bg, "--fg": s.fg, "--bg-d": s.bg_dark, "--fg-d": s.fg_dark } as CSSProperties;
  return <span className="badge inline-block shrink-0 rounded-full px-2.5 py-0.5 text-xs font-bold" style={style}>{s.label}</span>;
}

function Section({ title, children, right }: { title: string; children: ReactNode; right?: ReactNode }) {
  return (
    <section className={card}>
      <div className="flex items-baseline justify-between gap-2"><h2 className={h2}>{title}</h2>{right}</div>
      {children}
    </section>
  );
}

const usd = (v: number) => `$${v.toLocaleString("en-US", { maximumFractionDigits: v < 10 ? 4 : 2 })}`;
function capKo(v: number) {
  if (v >= 1e12) return `${(v / 1e12).toFixed(2)}조 달러`;
  if (v >= 1e8) return `${Math.round(v / 1e8).toLocaleString()}억 달러`;
  return `${Math.round(v / 1e4).toLocaleString()}만 달러`;
}
const volKo = (v: number) => (v >= 1e8 ? `${(v / 1e8).toFixed(1)}억 주` : `${Math.round(v / 1e4).toLocaleString()}만 주`);

function Range52({ low, high, price }: { low: number; high: number; price: number }) {
  const pct = Math.min(100, Math.max(0, ((price - low) / (high - low || 1)) * 100));
  return (
    <div>
      <div className="relative mt-2 h-1.5 rounded-full bg-slate-200 dark:bg-slate-700">
        <span className="absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-600 ring-2 ring-white dark:ring-slate-900" style={{ left: `${pct}%` }} />
      </div>
      <div className="mt-1 flex justify-between text-xs tabular-nums text-slate-500"><span>{usd(low)}</span><span>52주 범위</span><span>{usd(high)}</span></div>
    </div>
  );
}

/** "2026-11 중순"처럼 범위로 적힌 날짜도 순서대로 놓이게 대략의 날로 바꾼다 */
function dateKey(d: string) {
  if (/^\d{4}-\d{2}-\d{2}/.test(d)) return d.slice(0, 10);
  const m = d.match(/^(\d{4})-(\d{2})/);
  if (!m) return d;
  const day = /초/.test(d) ? "05" : /말/.test(d) ? "25" : "15";
  return `${m[1]}-${m[2]}-${day}`;
}

export default function Report({ data, cached, mock, busy, onRefresh }: Props) {
  if (data.error) {
    return <p className="mt-6 rounded-2xl bg-amber-50 p-4 text-sm font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">{data.error}</p>;
  }
  const q = data.quote;
  const up = (q?.change_pct ?? 0) >= 0;
  const events = [...data.events].sort((a, b) => dateKey(a.date).localeCompare(dateKey(b.date)));
  const risks = data.risks.filter(r => r.kind === "risk");
  const catalysts = data.risks.filter(r => r.kind === "catalyst");
  const sevRank = { high: 0, medium: 1, low: 2 } as const;

  return (
    <div className="mt-5">
      {mock && (
        <p className="rounded-xl bg-amber-100 px-4 py-2.5 text-sm font-semibold text-amber-900 dark:bg-amber-900/60 dark:text-amber-100">
          🧪 목업 데이터예요. 실제 뉴스가 아니라 화면 확인용 예시입니다.
        </p>
      )}

      {/* 1. 헤더 */}
      <section className={card}>
        {data.resolved_from && (
          <p className="mb-2 text-sm text-indigo-700 dark:text-indigo-300">“{data.resolved_from}” → <b>{data.ticker}</b>({data.company})로 해석했어요</p>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-extrabold tracking-tight">{data.ticker}</span>
              {data.exchange && <span className="text-xs font-semibold text-slate-500">{data.exchange}</span>}
            </div>
            <p className="truncate text-sm text-slate-600 dark:text-slate-300">{data.company}</p>
            <p className="text-xs text-slate-500">{[data.sector, data.country].filter(Boolean).join(" · ")}</p>
          </div>
          {q && (
            <div className="text-right">
              <div className="text-2xl font-extrabold tabular-nums">{usd(q.price)}</div>
              {q.change_pct != null && (
                <div className={`text-sm font-bold tabular-nums ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                  {up ? "▲" : "▼"} {Math.abs(q.change_pct).toFixed(2)}%
                </div>
              )}
            </div>
          )}
        </div>
        {q && (
          <>
            <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {q.market_cap_usd != null && <><dt className="text-slate-500">시가총액</dt><dd className="text-right font-semibold tabular-nums">{capKo(q.market_cap_usd)}</dd></>}
              {q.volume != null && <><dt className="text-slate-500">거래량</dt><dd className="text-right font-semibold tabular-nums">{volKo(q.volume)}</dd></>}
            </dl>
            {q.week52_low != null && q.week52_high != null && <Range52 low={q.week52_low} high={q.week52_high} price={q.price} />}
            <p className="mt-2 text-xs text-slate-400">시세 기준: {q.as_of} · {q.source}</p>
          </>
        )}
        <div className="mt-3 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
          <span>
            분석 {fmtStamp(data.analyzed_at.kst, "Asia/Seoul")} KST<br />
            <span className="text-slate-400">({fmtStamp(data.analyzed_at.et, "America/New_York")} ET){cached && " · 저장된 결과"}</span>
          </span>
          <button type="button" onClick={onRefresh} disabled={busy}
            className="shrink-0 rounded-lg px-3 py-2 font-semibold text-indigo-600 ring-1 ring-indigo-200 active:bg-indigo-50 disabled:opacity-50 dark:text-indigo-300 dark:ring-indigo-800 dark:active:bg-indigo-950">
            ↻ 새로고침
          </button>
        </div>
      </section>

      {/* 2. 종합 전망 */}
      <Section title="종합 전망" right={<Badge kind={data.summary.tone} />}>
        <p className="leading-relaxed">{data.summary.text}</p>
        {data.summary.move_explanation && (
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-sm dark:bg-slate-800/60">
            <span className="font-bold">오늘 등락 원인 · </span>{data.summary.move_explanation}
          </div>
        )}
      </Section>

      {/* 3. 최신 뉴스 */}
      <Section title="최신 뉴스" right={<span className="text-xs text-slate-500">{data.news.length}건</span>}>
        {data.news.length === 0 ? <p className="text-sm text-slate-500">최근 뉴스가 확인되지 않았어요.</p> : (
          <ul className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.news.map((n, i) => (
              <li key={i} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-start gap-2">
                  <Badge kind={n.sentiment} />
                  {n.url
                    ? <a href={n.url} target="_blank" rel="noopener noreferrer" className="font-semibold leading-snug underline-offset-2 hover:underline">{n.headline}</a>
                    : <span className="font-semibold leading-snug">{n.headline}</span>}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{n.description}</p>
                <p className="mt-1 text-xs text-slate-400">
                  {n.source} · {n.date}{n.category && ` · ${ui.news_categories[n.category]}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* 4. 이벤트 캘린더 */}
      <Section title="주요 이벤트 캘린더">
        {events.length === 0 ? <p className="text-sm text-slate-500">확인된 이벤트가 없어요.</p> : (
          // 휴대폰에서는 2칸(날짜 | 이벤트·유형·영향), 넓은 화면에서는 4칸 표
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-slate-500">
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="w-[6.5rem] py-2 pr-3 font-semibold">날짜</th><th className="py-2 pr-3 font-semibold">이벤트</th>
                <th className="hidden py-2 pr-3 font-semibold sm:table-cell">유형</th><th className="hidden py-2 font-semibold sm:table-cell">예상 영향</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e, i) => {
                const t = ui.event_types[e.type as EventTypeKey];
                const type = <span className="inline-flex items-center gap-1.5 text-xs font-semibold"><i className="size-2 rounded-full" style={{ background: t.color }} />{t.label}</span>;
                return (
                  <tr key={i} className={`border-b border-slate-100 align-top last:border-0 dark:border-slate-800 ${e.status === "past" ? "text-slate-500" : ""}`}>
                    <td className="py-2.5 pr-3 tabular-nums">
                      {e.date}
                      <div className={`mt-0.5 text-[11px] font-bold ${e.status === "past" ? "text-slate-400" : e.status === "upcoming" ? "text-indigo-600 dark:text-indigo-300" : "text-amber-600 dark:text-amber-300"}`}>
                        {ui.event_status[e.status]}
                      </div>
                    </td>
                    <td className="py-2.5 pr-3">
                      <div className="font-semibold">{e.title}</div>
                      <div className="mt-1 sm:hidden">{type}</div>
                      <p className="mt-1 leading-relaxed text-slate-600 sm:hidden dark:text-slate-300">{e.impact}</p>
                    </td>
                    <td className="hidden whitespace-nowrap py-2.5 pr-3 sm:table-cell">{type}</td>
                    <td className="hidden py-2.5 leading-relaxed sm:table-cell">{e.impact}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Section>

      {/* 5. 리스크 / 촉매 */}
      <Section title="리스크 · 촉매">
        {[["⚠️ 리스크", risks], ["🚀 촉매", catalysts]].map(([label, list]) => {
          const items = (list as typeof risks).slice().sort((a, b) => sevRank[a.severity] - sevRank[b.severity]);
          if (!items.length) return null;
          return (
            <div key={label as string} className="mb-4 last:mb-0">
              <h3 className="mb-2 text-sm font-bold text-slate-600 dark:text-slate-300">{label as string}</h3>
              <ul className="space-y-2">
                {items.map((r, i) => {
                  const sev = ui.severity[r.severity as SeverityKey];
                  return (
                    <li key={i} className="rounded-xl border-l-4 bg-slate-50 p-3 dark:bg-slate-800/60" style={{ borderColor: sev.color }}>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-bold">{r.title}</span>
                        <span className="ml-auto shrink-0 text-xs font-bold" style={{ color: sev.color }}>{sev.label}</span>
                      </div>
                      <p className="mt-1 text-sm leading-relaxed text-slate-600 dark:text-slate-300">{r.detail}</p>
                      {r.category && <p className="mt-1 text-xs text-slate-400">{ui.risk_categories[r.category]}</p>}
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        {data.risks.length === 0 && <p className="text-sm text-slate-500">확인된 리스크·촉매가 없어요.</p>}
      </Section>

      {/* 6. 출처 + 참고 링크 + 면책 */}
      <Section title="출처">
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {data.sources.map((s, i) => (
            <li key={i}><a href={s.url} target="_blank" rel="noopener noreferrer" className="break-all text-indigo-600 underline-offset-2 hover:underline dark:text-indigo-300">{s.title}</a></li>
          ))}
        </ol>
        <div className="mt-4 flex flex-wrap gap-2">
          {sources.reference_links_for_ui.map(l => (
            <a key={l.label} href={l.url.replaceAll("{T}", encodeURIComponent(data.ticker))} target="_blank" rel="noopener noreferrer"
              className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 active:bg-slate-200 dark:bg-slate-800 dark:text-slate-200">
              {l.label} ↗
            </a>
          ))}
        </div>
      </Section>
      <p className="mt-4 px-1 text-xs leading-relaxed text-slate-400">{ui.disclaimer}</p>
    </div>
  );
}
