// UI 개발용 목업 데이터. 실제 뉴스가 아니며 화면에도 "목업" 표시가 붙는다.
// 날짜는 오늘 기준 상대값으로 만들어서 언제 열어도 "최근"처럼 보이게 한다.
import type { Analysis } from "@/lib/schema";
import { nowStamps } from "@/lib/time";

const day = (offset: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
};
const month = (offset: number) => {
  const d = new Date();
  d.setMonth(d.getMonth() + offset);
  return d.toISOString().slice(0, 7);
};
const src = (path: string) => `https://example.com/mock/${path}`;

type Base = Omit<Analysis, "analyzed_at" | "resolved_from">;

const MOCKS: Record<string, () => Base> = {
  NVDA: () => ({
    ticker: "NVDA",
    company: "NVIDIA Corporation",
    exchange: "NASDAQ",
    sector: "반도체",
    country: "미국",
    quote: { price: 182.4, change_pct: 1.8, market_cap_usd: 4.45e12, week52_low: 86.6, week52_high: 195.2, volume: 182_000_000, prev_volume: 151_000_000, dollar_volume_usd: 33_200_000_000, as_of: `${day(0)} 16:00 ET`, source: "목업" },
    summary: {
      tone: "positive",
      text: "데이터센터 수요가 이어지며 다음 분기 실적 기대가 유지되고 있습니다. 주요 고객사의 설비 투자 확대 발표가 이어졌지만, 대중국 수출 규제 관련 불확실성은 남아 있습니다. 실적 발표일을 앞두고 변동성이 커질 수 있습니다.",
      move_explanation: "대형 클라우드 고객사의 AI 설비 투자 상향 발표 이후 반도체 업종 전반이 강세를 보였습니다.",
    },
    news: [
      { headline: "대형 클라우드 3사, 내년 AI 설비 투자 계획 상향", description: "주요 고객사의 설비 투자 확대는 데이터센터 GPU 수요에 직접적인 긍정 요인입니다.", source: "목업 통신", url: src("nvda-1"), date: day(-1), sentiment: "positive", category: "macro" },
      { headline: "차세대 GPU 플랫폼 양산 일정 공개", description: "신제품 출하가 예정대로 진행되면 다음 두 분기 매출 성장에 기여할 수 있습니다.", source: "목업 뉴스", url: src("nvda-2"), date: day(-2), sentiment: "positive", category: "product" },
      { headline: "미 상무부, 첨단 칩 수출 규정 개정안 검토", description: "중국향 매출 비중에 따라 단기 불확실성 요인입니다. 구체적인 시행 일정은 아직 확정되지 않았습니다.", source: "목업 경제", url: src("nvda-3"), date: day(-3), sentiment: "negative", category: "regulatory" },
      { headline: "증권사 2곳, 목표가 상향", description: "애널리스트 등급 변경은 단기 심리에 영향을 주지만 투자 판단 근거로는 제한적입니다.", source: "목업 마켓", url: src("nvda-4"), date: day(-5), sentiment: "positive", category: "analyst" },
      { headline: "임원 Form 4 매도 공시", description: "사전 계획(10b5-1)에 따른 정기 매도로, 주가 영향은 제한적인 것으로 보입니다.", source: "SEC EDGAR (목업)", url: src("nvda-5"), date: day(-6), sentiment: "neutral", category: "filing" },
    ],
    events: [
      { date: day(-30), title: "2분기 실적 발표", type: "earnings", status: "past", impact: "매출·가이던스가 예상치를 웃돌았으나 주가 반응은 제한적이었습니다." },
      { date: day(12), title: "3분기 실적 발표", type: "earnings", status: "upcoming", impact: "데이터센터 매출과 다음 분기 가이던스가 핵심 변수입니다." },
      { date: `${month(1)} 중순`, title: "개발자 콘퍼런스", type: "product", status: "estimated", impact: "신제품 로드맵 발표 시 기대감이 반영될 수 있습니다." },
      { date: `${month(2)} 초`, title: "수출 규정 개정안 확정 예상", type: "regulatory", status: "estimated", impact: "규제 강도에 따라 중국 매출 전망이 조정될 수 있습니다." },
    ],
    risks: [
      { kind: "risk", category: "jurisdiction", title: "대중국 수출 규제", detail: "규정 개정 시 일부 제품의 중국 판매가 제한될 수 있습니다.", severity: "medium" },
      { kind: "risk", category: "business", title: "높은 기대치", detail: "실적이 예상에 소폭 못 미쳐도 주가가 크게 하락할 수 있습니다.", severity: "medium" },
      { kind: "catalyst", category: "business", title: "AI 설비 투자 확대", detail: "주요 고객사의 투자 상향이 이어지는 한 수요 기반은 견조합니다.", severity: "high" },
    ],
    sources: [
      { title: "목업 통신 — AI 설비 투자", url: src("nvda-1") },
      { title: "목업 뉴스 — GPU 양산 일정", url: src("nvda-2") },
      { title: "SEC EDGAR (목업)", url: src("nvda-5") },
    ],
  }),

  BIRK: () => ({
    ticker: "BIRK",
    company: "Birkenstock Holding plc",
    exchange: "NYSE",
    sector: "소비재(신발)",
    country: "독일/영국",
    quote: { price: 47.15, change_pct: -0.6, market_cap_usd: 8.9e9, week52_low: 42.1, week52_high: 64.8, volume: 1_400_000, prev_volume: 1_900_000, dollar_volume_usd: 66_000_000, as_of: `${day(0)} 16:00 ET`, source: "목업" },
    summary: {
      tone: "mixed",
      text: "도매 채널 성장은 견조하지만 미국 관세와 환율 부담이 마진 전망을 누르고 있습니다. 다음 분기 실적에서 가격 인상 효과가 확인될지가 관건입니다.",
      move_explanation: "확인된 촉매 없음",
    },
    news: [
      { headline: "회계연도 4분기 실적 발표일 공지", description: "발표일이 확정되며 가이던스 확인 이벤트를 앞두게 됐습니다.", source: "목업 IR", url: src("birk-1"), date: day(-2), sentiment: "neutral", category: "earnings" },
      { headline: "미국 수입 관세 인상분 일부 가격 반영", description: "마진 방어에는 도움이 되지만 수요 둔화 가능성도 있습니다.", source: "목업 리테일", url: src("birk-2"), date: day(-6), sentiment: "neutral", category: "macro" },
      { headline: "주요 주주 블록딜로 지분 일부 매각", description: "대주주 매도는 단기 수급 부담 요인입니다.", source: "목업 마켓", url: src("birk-3"), date: day(-11), sentiment: "negative", category: "offering" },
    ],
    events: [
      { date: day(-11), title: "대주주 블록딜", type: "offering", status: "past", impact: "단기 수급 부담으로 주가가 하락했습니다." },
      { date: day(20), title: "회계연도 4분기 실적 발표", type: "earnings", status: "upcoming", impact: "가격 인상 효과와 내년 가이던스가 핵심입니다." },
    ],
    risks: [
      { kind: "risk", category: "overhang", title: "대주주 추가 매도 가능성", detail: "보호예수 해제 물량이 남아 있어 추가 블록딜이 나올 수 있습니다.", severity: "medium" },
      { kind: "risk", category: "jurisdiction", title: "미국 관세", detail: "관세 인상이 이어지면 매출총이익률이 낮아질 수 있습니다.", severity: "medium" },
      { kind: "catalyst", category: "business", title: "도매 채널 확대", detail: "신규 매장 입점이 이어지며 매출 성장을 뒷받침하고 있습니다.", severity: "low" },
    ],
    sources: [
      { title: "목업 IR — 실적 발표일", url: src("birk-1") },
      { title: "목업 마켓 — 블록딜", url: src("birk-3") },
    ],
  }),

  KNRX: () => ({
    ticker: "KNRX",
    company: "Kinara Rx Holdings (목업)",
    exchange: "NASDAQ",
    sector: "바이오",
    country: "홍콩",
    quote: { price: 1.84, change_pct: 142.1, market_cap_usd: 21_000_000, week52_low: 0.41, week52_high: 6.2, volume: 96_000_000, prev_volume: 1_850_000, dollar_volume_usd: 171_000_000, as_of: `${day(0)} 16:00 ET`, source: "목업" },
    summary: {
      tone: "mixed",
      text: "보도자료 한 건으로 거래량이 평소의 수십 배로 늘며 급등했습니다. 그러나 직전에 재판매 등록(F-1)이 효력을 얻어 오버행 물량이 크고, 최소 호가 미달 통지 상태여서 변동성이 매우 큽니다.",
      move_explanation: "임상 협력 MOU 보도자료(GlobeNewswire) 발표 직후 급등. 계약 금액·조건은 공개되지 않았습니다.",
    },
    news: [
      { headline: "해외 제약사와 임상 협력 MOU 체결 발표", description: "구체적 금액·조건이 없는 MOU로, 실질 가치 판단이 어렵습니다. 급등의 직접 원인입니다.", source: "GlobeNewswire (목업)", url: src("knrx-1"), date: day(0), sentiment: "positive", category: "promotion" },
      { headline: "F-1 재판매 등록 효력 발생", description: "기존 주주 보유 약 1,200만 주가 시장에 매도될 수 있게 됐습니다.", source: "SEC EDGAR (목업)", url: src("knrx-2"), date: day(-3), sentiment: "negative", category: "filing" },
      { headline: "나스닥, 최소 호가 기준 미달 통지", description: "180일 유예기간 안에 10거래일 연속 $1 이상을 회복해야 합니다.", source: "6-K (목업)", url: src("knrx-3"), date: day(-40), sentiment: "negative", category: "listing" },
      { headline: "LULD 변동성 일시정지 3회", description: "급등 과정에서 거래가 여러 차례 멈췄습니다.", source: "Nasdaq Trader (목업)", url: src("knrx-4"), date: day(0), sentiment: "neutral", category: "other" },
    ],
    events: [
      { date: day(-40), title: "최소 호가 기준 미달 통지 수령", type: "listing", status: "past", impact: "유예기간 내 회복 실패 시 상장폐지 절차가 시작될 수 있습니다." },
      { date: day(-3), title: "F-1 재판매 등록 효력", type: "offering", status: "past", impact: "오버행 물량이 풀려 급등 시 매도 압력이 커질 수 있습니다." },
      { date: day(140), title: "상장유지 유예기간 만료", type: "listing", status: "upcoming", impact: "기한 전 역분할로 기준을 맞출 가능성이 있습니다." },
      { date: `${month(2)} 중`, title: "역분할 주총 안건 (추정)", type: "corporate_action", status: "estimated", impact: "역분할 발표 시 단기 하락 압력이 나타나는 경우가 많습니다." },
    ],
    risks: [
      { kind: "risk", category: "overhang", title: "재판매 등록 물량", detail: "F-1 효력으로 약 1,200만 주(유통주식의 약 60%)가 매도 가능해졌습니다.", severity: "high" },
      { kind: "risk", category: "listing", title: "최소 호가 미달", detail: "유예기간 만료 전 $1 회복이 필요합니다.", severity: "high" },
      { kind: "risk", category: "promotion", title: "근거 약한 보도자료", detail: "금액·조건 없는 MOU 발표로, 유료 홍보성 기사일 가능성이 있습니다.", severity: "medium" },
      { kind: "risk", category: "dilution", title: "워런트 행사 가능성", detail: "행사가 $1.50 워런트가 남아 있어 추가 희석 요인입니다.", severity: "medium" },
      { kind: "risk", category: "jurisdiction", title: "홍콩계 초소형 IPO", detail: "규제 당국의 감시 대상 업종·지역입니다.", severity: "low" },
      { kind: "catalyst", category: "business", title: "임상 협력 구체화", detail: "계약 금액·조건이 공개되면 재평가 계기가 될 수 있습니다.", severity: "low" },
    ],
    sources: [
      { title: "GlobeNewswire (목업) — MOU 발표", url: src("knrx-1") },
      { title: "SEC EDGAR (목업) — F-1", url: src("knrx-2") },
      { title: "Nasdaq Trader (목업) — 거래정지", url: src("knrx-4") },
    ],
  }),
};

// 오타·회사명 → 티커 (실제로는 서버가 Finnhub 검색/Claude로 해석)
const ALIASES: Record<string, string> = { BIRD: "BIRK", BIRKENSTOCK: "BIRK", NVIDIA: "NVDA", 엔비디아: "NVDA", 버켄스탁: "BIRK" };

export const MOCK_TICKERS = Object.keys(MOCKS);

export function mockAnalysis(query: string): Analysis {
  const q = query.trim().toUpperCase();
  const ticker = MOCKS[q] ? q : ALIASES[q] ?? ALIASES[query.trim()];
  const analyzed_at = nowStamps();
  if (!ticker || !MOCKS[ticker]) {
    return {
      ticker: q, company: "", analyzed_at, summary: { tone: "neutral", text: "" },
      news: [], events: [], risks: [], sources: [],
      error: `목업 단계에서는 ${MOCK_TICKERS.join(", ")}만 볼 수 있어요. (실제 분석 연결 후 모든 종목 지원)`,
    };
  }
  return { ...MOCKS[ticker](), resolved_from: ticker !== q ? query.trim().toUpperCase() : null, analyzed_at };
}
