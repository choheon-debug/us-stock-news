import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // 서버가 실행 중에 읽는 프롬프트·스키마 파일을 배포 묶음에 넣는다
  outputFileTracingIncludes: { "/api/analyze": ["./prompts/**", "./data/**"] },
};

export default nextConfig;
