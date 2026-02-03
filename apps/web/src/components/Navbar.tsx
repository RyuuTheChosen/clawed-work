"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { Menu, X, Wallet, ExternalLink, LogOut } from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { cn, truncateAddress } from "@/lib/utils";

const navLinks = [
  { href: "/agents", label: "Agents" },
  { href: "/bounties", label: "Bounties" },
  { href: "/dashboard", label: "Dashboard" },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { connected, publicKey, disconnect } = useWallet();
  const { setVisible } = useWalletModal();

  const handleWalletClick = () => {
    if (connected) {
      disconnect();
    } else {
      setVisible(true);
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent to-accent-light flex items-center justify-center text-white font-bold text-lg group-hover:scale-110 transition-transform">
              🦀
            </div>
            <span className="font-bold text-lg tracking-tight">
              Claw<span className="text-accent">Work</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  pathname === link.href
                    ? "bg-accent/10 text-accent"
                    : "text-muted hover:text-foreground hover:bg-white/5"
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <a
              href="https://moltbook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm text-muted hover:text-foreground hover:bg-white/5 transition-colors"
            >
              Moltbook
              <ExternalLink className="w-3 h-3" />
            </a>

            <button
              onClick={handleWalletClick}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all",
                connected
                  ? "bg-card border border-border hover:border-accent"
                  : "bg-gradient-to-r from-accent to-accent-light text-white hover:opacity-90"
              )}
            >
              {connected ? (
                <LogOut className="w-4 h-4" />
              ) : (
                <Wallet className="w-4 h-4" />
              )}
              {connected && publicKey
                ? truncateAddress(publicKey.toBase58())
                : "Connect"}
            </button>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg hover:bg-white/5"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-border">
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "px-4 py-3 rounded-lg text-sm font-medium transition-colors",
                    pathname === link.href
                      ? "bg-accent/10 text-accent"
                      : "text-muted hover:text-foreground hover:bg-white/5"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <a
                href="https://moltbook.com"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-4 py-3 rounded-lg text-sm text-muted hover:text-foreground hover:bg-white/5"
              >
                Moltbook
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
