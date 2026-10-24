# 미증시뉴스

미국 주식 티커를 입력하면 최신 뉴스와 주가에 영향을 줄 이벤트를 한국어 브리핑으로 보여 주는 웹앱입니다. 작업 지침은 `CLAUDE.md`.

## 동작 방식
- `ANTHROPIC_API_KEY`가 있으면 실제 분석: ① SEC 공시·Yahoo 시세(전일 거래량 포함)·Nasdaq 거래정지 수집 → ② Claude(`claude-sonnet-5-5`, `ANTHROPIC_MODEL`로 변경) + 웹 검색 → ③ zod 검증, 실패 시 구조화 출력으로 1회 재정리 → ④ 티커별 20분 캐시
- 키가 없거나 `USE_MOCK=1`이면 목업 결과(화면에 "목업" 표시). 목업 종목: `NVDA`, `BIRK`(`BIRD` 오타 예시), `KNRX`
- 시세는 서버 수집값이 검색값보다 우선. 거래대금은 받은 값이 없으면 화면이 가격×거래량으로 추정(≈)

## 실행
```bash
npm install
cp .env.example .env.local   # 키는 서버 전용
npm run dev                  # http://localhost:3000
```

## 구조
- `app/api/analyze/route.ts`: `POST {ticker, refresh}` → SSE(진행 상태 → 최종 JSON)
- `lib/analyze.ts`: 분석 파이프라인과 캐시
- `lib/collectors/`: SEC EDGAR, 시세(Yahoo·Finnhub), 거래정지 RSS 수집 (실패 허용)
- `lib/claude.ts`: Claude + web_search, 인용 수집, 스키마 검증·재정리
- `lib/schema.ts`: `data/analysis-schema.json`을 옮긴 zod 스키마
- `components/StockApp.tsx`: 입력·빠른 티커·최근 조회·진행 표시
- `components/Report.tsx`: 헤더 → 종합 전망 → 뉴스 → 이벤트 캘린더 → 리스크·촉매 → 출처·면책

## 다음 단계
- 실제 티커(NVDA, BIRK, FCUV, MSGY, KNRX)로 결과 품질 확인, 프롬프트 다듬기
