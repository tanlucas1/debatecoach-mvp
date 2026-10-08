import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@streamoji/aitwin"],
  outputFileTracingIncludes: {
    "/api/debate/turn": ["./case-files/**/*.docx"],
    "/api/speech/session": ["./case-files/**/*.docx"],
    "/api/debate/grade": ["./case-files/**/*.docx"],
  },
};

export default nextConfig;
