import type { Metadata, Viewport } from "next";
import "./globals.css";
import Shell from "@/components/Shell";
import { I18nProvider } from "@/lib/i18n";

export const metadata: Metadata = {
  title: {
    default: "THE WALL — Robinhood Chain Builder Dashboard",
    template: "%s | THE WALL",
  },
  description:
    "The definitive builder analytics dashboard for Robinhood Chain (Chain ID 4663). Track deployed contracts, token launches, reward claims, on-chain activity, and stock market data. Powered by Blockscout with real-time data.",
  keywords: [
    "Robinhood Chain",
    "Chain ID 4663",
    "builder dashboard",
    "on-chain analytics",
    "token launches",
    "reward claims",
    "DeFi",
    "smart contracts",
    "Blockscout",
    "Web3",
  ],
  authors: [{ name: "THE WALL" }],
  creator: "THE WALL",
  publisher: "THE WALL",
  metadataBase: new URL("https://thewall.com"),
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://thewall.com",
    siteName: "THE WALL",
    title: "THE WALL — Robinhood Chain Builder Dashboard",
    description:
      "Track builders, deployed contracts, token launches, and reward claims on Robinhood Chain (Chain ID 4663). Real-time on-chain analytics powered by Blockscout.",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "THE WALL — Robinhood Chain Builder Dashboard",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "THE WALL — Robinhood Chain Builder Dashboard",
    description:
      "Track builders, deployed contracts, token launches, and reward claims on Robinhood Chain (Chain ID 4663).",
    images: ["/og-image.png"],
    creator: "@suggestionii",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  other: {
    "mobile-web-app-capable": "yes",
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "black-translucent",
    "theme-color": "#00c805",
    "color-scheme": "dark light",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
window.addEventListener("error",function(e){if(e.message&&e.message.includes("Cannot redefine property: ethereum")){e.preventDefault();e.stopPropagation()}});
`.trim(),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "THE WALL RH",
              applicationCategory: "FinanceApplication",
              operatingSystem: "Web",
              description:
                "Builder analytics dashboard for Robinhood Chain (Chain ID 4663). Track deployed contracts, token launches, and reward claims.",
              url: "https://thewall.com",
              creator: {
                "@type": "Organization",
              name: "THE WALL",
              },
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              featureList: [
                "Builder directory with on-chain profiles",
                "Token launch tracking",
                "Reward claim history",
                "Real-time network statistics",
              ],
            }),
          }}
        />
      </head>
      <body className="min-h-screen bg-[var(--bg)] text-[var(--text)] antialiased">
        <I18nProvider>
          <Shell>{children}</Shell>
        </I18nProvider>
      </body>
    </html>
  );
}
