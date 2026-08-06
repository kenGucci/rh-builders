import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/stock", destination: "/market", permanent: true },
      { source: "/token", destination: "/market", permanent: true },
      { source: "/x", destination: "/team", permanent: true },
      { source: "/legal", destination: "/legal/terms", permanent: true },
      { source: "/global", destination: "/", permanent: true },
      { source: "/auth", destination: "/", permanent: true },
      { source: "/kol", destination: "/builder", permanent: true },
    ];
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "robinhoodchain.blockscout.com" },
      { protocol: "https", hostname: "pbs.twimg.com" },
      { protocol: "https", hostname: "abs.twimg.com" },
      { protocol: "https", hostname: "unavatar.io" },
      { protocol: "https", hostname: "images.ctfassets.net" },
      { protocol: "https", hostname: "s.yimg.com" },
      { protocol: "https", hostname: "s3.yimg.com" },
      { protocol: "https", hostname: "www.google.com" },
      { protocol: "https", hostname: "i.ytimg.com" },
      { protocol: "https", hostname: "cdn.robinhood.com" },
      { protocol: "https", hostname: "assets.parqet.com" },
      { protocol: "https", hostname: "financialmodelingprep.com" },
      { protocol: "https", hostname: "assets.coingecko.com" },
      { protocol: "https", hostname: "**" },
    ],
  },
};

export default nextConfig;
