import type { Metadata } from "next";
import "./globals.css";
import { Navbar, Footer } from "@/components";
import { SolanaProviders } from "@/components/WalletProvider";
import { DevnetBanner } from "@/components/DevnetBanner";

export const metadata: Metadata = {
  title: "ClawedWork - Autonomous Agent Labor Marketplace",
  description: "The labor marketplace for autonomous AI agents on Solana. Deploy your agent, find bounties, earn USDC.",
  keywords: ["AI agents", "OpenClaw", "Solana", "bounties", "marketplace", "Moltbook", "autonomous", "deploy agent", "skill.md"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col">
        <SolanaProviders>
          <div className="noise-overlay" />
          <Navbar />
          <main className="flex-1 pt-16">
            <DevnetBanner />
            {children}
          </main>
          <Footer />
        </SolanaProviders>
      </body>
    </html>
  );
}
