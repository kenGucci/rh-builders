import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
    ],
  },
};

export default nextConfig;
