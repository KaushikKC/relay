import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import localFont from "next/font/local";
import "./globals.css";
import { Web3Provider } from "@/lib/providers/Web3Provider";


const monumentExtended = localFont({
  src: [
    {
      path: "../public/fonts/MonumentExtended-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../public/fonts/MonumentExtended-Ultrabold.otf",
      weight: "800",
      style: "normal",
    },
  ],
  variable: "--font-monument",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Relay — One-Click Access to Hyperliquid",
  description:
    "Relay lets you move from any chain into Hyperliquid in a single click. Seamless cross-chain onboarding powered by LI.FI with instant deposit and trading readiness.",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${monumentExtended.variable} ${spaceGrotesk.variable} antialiased`}
      >
        <Web3Provider>
          {children}
        </Web3Provider>
      </body>
    </html>
  );
}
