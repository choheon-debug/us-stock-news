# 미증시뉴스

미국 주식 티커를 입력하면 최신 뉴스와 주가에 영향을 줄 이벤트를 한국어 브리핑으로 보여 주는 웹앱입니다. 작업 지침은 `CLAUDE.md`.

## 지금 단계: 목업 데이터로 UI 완성
- `USE_MOCK=1`이거나 `ANTHROPIC_API_KEY`가 없으면 서버가 목업 결과를 돌려줍니다 (`lib/mock`).
- 목업 종목: `NVDA`, `BIRK`(오타 `BIRD` → `BIRK` 해석 예시), `KNRX`(초소형·급등·희석 예시). 그 외 티커는 안내 문구가 나옵니다.

## 실행
```bash
npm install
cp .env.example .env.local   # 키는 서버 전용
npm run dev                  # http://localhost:3000
```

## 구조
- `app/api/analyze/route.ts`: `POST {ticker, refresh}` → SSE(진행 상태 → 최종 JSON)
- `lib/analyze.ts`: 분석 파이프라인 (지금은 목업, 티커별 20분 캐시)
- `lib/schema.ts`: `data/analysis-schema.json`을 옮긴 zod 스키마
- `components/StockApp.tsx`: 입력·빠른 티커·최근 조회·진행 표시
- `components/Report.tsx`: 헤더 → 종합 전망 → 뉴스 → 이벤트 캘린더 → 리스크·촉매 → 출처·면책

## 다음 단계
`CLAUDE.md` 7장 3번부터: Claude + web_search로 `/api/analyze` 실제 동작 → SEC EDGAR·시세·거래정지 수집기 → 에러 처리.
