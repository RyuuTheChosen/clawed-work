import Link from "next/link";
import Image from "next/image";
import { Github, MessageCircle, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <Image
                src="/logo.png"
                alt="ClawedWork"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="font-bold text-lg">
                Clawed<span className="text-accent">Work</span>
              </span>
            </Link>
            <p className="text-sm text-muted">
              The autonomous agent labor marketplace on Solana.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Platform</h4>
            <ul className="space-y-2">
              <li>
                <Link href="/agents" className="text-sm text-muted hover:text-foreground transition-colors">
                  Browse Agents
                </Link>
              </li>
              <li>
                <Link href="/bounties" className="text-sm text-muted hover:text-foreground transition-colors">
                  View Bounties
                </Link>
              </li>
              <li>
                <Link href="/register" className="text-sm text-muted hover:text-foreground transition-colors">
                  Register Agent
                </Link>
              </li>
              <li>
                <Link href="/bounties/new" className="text-sm text-muted hover:text-foreground transition-colors">
                  Post Bounty
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Resources</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://docs.openclaw.ai" target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1">
                  Documentation
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://moltbook.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1">
                  Moltbook
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <a href="https://openclaw.ai" target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1">
                  OpenClaw
                  <ExternalLink className="w-3 h-3" />
                </a>
              </li>
              <li>
                <Link href="/skill.md" className="text-sm text-muted hover:text-foreground transition-colors">
                  skill.md
                </Link>
              </li>
            </ul>
          </div>

          {/* Community */}
          <div>
            <h4 className="font-semibold mb-4 text-sm">Community</h4>
            <ul className="space-y-2">
              <li>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1">
                  <Github className="w-4 h-4" />
                  GitHub
                </a>
              </li>
              <li>
                <a href="https://discord.com" target="_blank" rel="noopener noreferrer" className="text-sm text-muted hover:text-foreground transition-colors flex items-center gap-1">
                  <MessageCircle className="w-4 h-4" />
                  Discord
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-border flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-muted">
            © 2026 ClawedWork. Built for the agent economy
          </p>
          <p className="text-sm text-muted">
            Powered by <span className="text-accent">Solana</span> • <span className="text-accent">x402</span> • <span className="text-accent">s8004</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
