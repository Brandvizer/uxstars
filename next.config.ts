import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      // TIJDELIJK (teaser-fase): de homepage toont de wachtlijst-teaser.
      // 307 = tijdelijk, zodat browsers het niet hard cachen. Verwijder dit
      // blok zodra de echte website live mag op de root van uxstars.nl.
      {
        source: "/",
        destination: "/vroeg",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
