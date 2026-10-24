// 분석 시각을 한국(KST)과 미 동부(ET) 두 가지로 표기한다.

/** 주어진 시간대의 현지 시각을 "+09:00" 같은 오프셋이 붙은 ISO 문자열로 */
function isoIn(timeZone: string, date: Date): string {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-US", {
      timeZone, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", second: "2-digit",
    }).formatToParts(date).map(p => [p.type, p.value]),
  );
  const local = `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}`;
  const offsetMin = Math.round((Date.parse(`${local}Z`) - Math.floor(date.getTime() / 1000) * 1000) / 60000);
  const sign = offsetMin >= 0 ? "+" : "-", abs = Math.abs(offsetMin);
  return `${local}${sign}${String(Math.floor(abs / 60)).padStart(2, "0")}:${String(abs % 60).padStart(2, "0")}`;
}

export const nowStamps = (date = new Date()) => ({ kst: isoIn("Asia/Seoul", date), et: isoIn("America/New_York", date) });

/** "10월 24일 (금) 오후 3:05" 같은 한국어 표기 */
export function fmtStamp(iso: string, timeZone: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("ko-KR", { timeZone, month: "long", day: "numeric", weekday: "short", hour: "numeric", minute: "2-digit" }).format(d);
}
