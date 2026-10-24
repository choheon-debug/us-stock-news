// Nasdaq Trader 거래정지 RSS: 당일 거래정지(LULD, T1/T12/H10 등)와 재개 시각
import { getText } from "./http";
import { ui } from "@/lib/ui-config";

export type Halt = { date: string; time: string; code: string; reason: string; resume: string };

const tag = (item: string, name: string) => item.match(new RegExp(`<ndaq:${name}>([^<]*)</ndaq:${name}>`))?.[1]?.trim() ?? "";

export async function fetchHalts(ticker: string): Promise<Halt[]> {
  const xml = await getText("https://www.nasdaqtrader.com/rss.aspx?feed=tradehalts");
  if (!xml) return [];
  const out: Halt[] = [];
  for (const item of xml.split("<item>").slice(1)) {
    if (tag(item, "IssueSymbol").toUpperCase() !== ticker.toUpperCase()) continue;
    const code = tag(item, "ReasonCode");
    out.push({
      date: tag(item, "HaltDate"), time: tag(item, "HaltTime"), code,
      reason: (ui.halt_codes as Record<string, string>)[code] ?? code,
      resume: [tag(item, "ResumptionDate"), tag(item, "ResumptionTradeTime")].filter(Boolean).join(" "),
    });
  }
  return out;
}
