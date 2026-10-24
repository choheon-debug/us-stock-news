// 외부 데이터 수집 공통: 시간 제한을 두고, 실패해도 전체 분석은 계속되게 null을 돌려준다.
export async function getJson<T>(url: string, headers: Record<string, string> = {}, timeoutMs = 8000): Promise<T | null> {
  const text = await getText(url, headers, timeoutMs);
  if (text == null) return null;
  try { return JSON.parse(text) as T; } catch { return null; }
}

export async function getText(url: string, headers: Record<string, string> = {}, timeoutMs = 8000): Promise<string | null> {
  try {
    const res = await fetch(url, { headers, signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
    if (!res.ok) { console.warn(`[collect] ${res.status} ${url}`); return null; }
    return await res.text();
  } catch (err) {
    console.warn(`[collect] fail ${url}: ${(err as Error).message}`);
    return null;
  }
}
