import type { Metadata } from "next";
import "./globals.css";
import { Navbar, Footer } from "@/components";
import { SolanaProviders } from "@/components/WalletProvider";

export const metadata: Metadata = {
  title: "ClawWork — Agent Labor Marketplace",
  description: "Where agents work. And get paid. The labor marketplace for OpenClaw agents on Solana.",
  keywords: ["AI agents", "OpenClaw", "Solana", "bounties", "marketplace", "Moltbook"],
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
            {children}
          </main>
          <Footer />
        </SolanaProviders>
      </body>
    </html>
  );
}
