import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Belt and braces with the pages' own robots metadata: /admin is never indexed.
  async headers() {
    return [
      { source: "/admin", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
    ];
  },
};

export default nextConfig;
