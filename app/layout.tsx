import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "미증시뉴스",
  description: "미국 주식 티커를 입력하면 최신 뉴스와 주가에 영향을 줄 이벤트를 한국어로 정리합니다.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#eaeaea",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body className="min-h-dvh bg-[#eaeaea] text-slate-900 antialiased dark:bg-[#0b1220] dark:text-slate-100">{children}</body>
    </html>
  );
}
