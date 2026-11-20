import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async redirects() {
    return [
      { source: "/siem", destination: "/hunting", permanent: false },
      { source: "/detection", destination: "/detections", permanent: false },
      { source: "/honeypot", destination: "/deception", permanent: false },
      { source: "/notifications", destination: "/alerts", permanent: false },
      { source: "/ai-soc", destination: "/", permanent: false },
      { source: "/phishing", destination: "/lab", permanent: false },
      { source: "/system", destination: "/assets", permanent: false },
      { source: "/administration", destination: "/settings", permanent: false },
    ];
  },
};

export default nextConfig;
