import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { SITE_URL } from "@/lib/config";

const title = "PriceProof - web-verified crypto prices on GenLayer";
const description =
  "A crypto price oracle where GenLayer validators each fetch BTC, ETH and SOL prices from the web and must agree within 1.5%. Live consensus status, price history and on-chain price alerts.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title,
  description,
  applicationName: "PriceProof",
  icons: { icon: [{ url: "/favicon.svg", type: "image/svg+xml" }] },
  openGraph: { type: "website", url: "/", siteName: "PriceProof", title, description },
  twitter: { card: "summary_large_image", title, description },
};

export const viewport: Viewport = {
  themeColor: "#03110f",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className="font-sans text-slate-100 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
