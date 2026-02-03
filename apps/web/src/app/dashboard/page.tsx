"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bot, DollarSign, TrendingUp, Clock, Plus,
  Star, CheckCircle, ArrowUpRight, Wallet
} from "lucide-react";
import {
  cn, formatUSDC, truncateAddress, timeAgo, generateAvatar
} from "@/lib/utils";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAgent, useMyBounties, useBounties } from "@/hooks";
import { DevnetFaucet } from "@/components/DevnetFaucet";

export default function DashboardPage() {
  const [view, setView] = useState<"agent" | "client">("agent");
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();

  const { agent: myAgent, loading: agentLoading } = useAgent(
    publicKey?.toBase58() || ""
  );
  const { bounties: myBounties, loading: bountiesLoading } = useMyBounties();
  const { bounties: allBounties } = useBounties();

  // Agent assigned bounties (where this wallet's agent is working)
  const activeBounties = allBounties.filter(
    (b) =>
      b.assignedAgent === publicKey?.toBase58() &&
      (b.status === "in_progress" || b.status === "claimed")
  );

  const totalEarned = myAgent?.totalEarned || 0;
  const totalSpent = myBounties.reduce((sum, b) => sum + b.budget, 0);

  if (!connected) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="card p-12 text-center max-w-lg mx-auto">
          <div className="w-20 h-20 rounded-2xl bg-accent/20 flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-10 h-10 text-accent" />
          </div>
          <h1 className="text-2xl font-bold mb-4">Connect Your Wallet</h1>
          <p className="text-muted mb-8">
            Connect your Solana wallet to view your agents, bounties, and earnings.
          </p>
          <button
            onClick={() => setVisible(true)}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white font-semibold hover:opacity-90 transition-all"
          >
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  const loading = agentLoading || bountiesLoading;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Dashboard</h1>
          <p className="text-muted">
            Manage your agents and bounties
          </p>
        </div>

        {/* View Toggle */}
        <div className="flex items-center gap-1 p-1 rounded-xl bg-card border border-border">
          <button
            onClick={() => setView("agent")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              view === "agent"
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground"
            )}
          >
            <Bot className="w-4 h-4 inline mr-2" />
            Agent Owner
          </button>
          <button
            onClick={() => setView("client")}
            className={cn(
              "px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              view === "client"
                ? "bg-accent text-white"
                : "text-muted hover:text-foreground"
            )}
          >
            <DollarSign className="w-4 h-4 inline mr-2" />
            Client
          </button>
        </div>
      </div>

      {/* Devnet Faucet */}
      <div className="mb-8">
        <DevnetFaucet />
      </div>

      {/* Agent Owner View */}
      {view === "agent" && (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{myAgent ? 1 : 0}</div>
                  <div className="text-xs text-muted">My Agent</div>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {myAgent?.bountiesCompleted || 0}
                  </div>
                  <div className="text-xs text-muted">Completed</div>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-success" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-accent">
                    {formatUSDC(totalEarned)}
                  </div>
                  <div className="text-xs text-muted">Total Earned</div>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{activeBounties.length}</div>
                  <div className="text-xs text-muted">Active Jobs</div>
                </div>
              </div>
            </div>
          </div>

          {/* My Agent */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg">My Agent</h2>
              {!myAgent && (
                <Link
                  href="/register"
                  className="flex items-center gap-2 text-sm text-accent hover:underline"
                >
                  <Plus className="w-4 h-4" />
                  Register
                </Link>
              )}
            </div>

            {myAgent ? (
              <Link
                href={`/agents/${publicKey!.toBase58()}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-card-hover hover:bg-white/5 transition-colors"
              >
                <Image
                  src={generateAvatar(myAgent.address)}
                  alt={myAgent.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-xl"
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{myAgent.name}</h3>
                    <span
                      className={cn(
                        "badge text-xs",
                        myAgent.availability === "available"
                          ? "badge-success"
                          : myAgent.availability === "busy"
                          ? "badge-warning"
                          : "bg-white/10 text-muted"
                      )}
                    >
                      {myAgent.availability}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted mt-1">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-accent fill-accent" />
                      {myAgent.reputation.toFixed(1)}
                    </span>
                    <span>{myAgent.bountiesCompleted} completed</span>
                    <span className="text-accent">
                      {formatUSDC(myAgent.totalEarned)} earned
                    </span>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-muted" />
              </Link>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted mb-4">No agent registered yet</p>
                <Link
                  href="/register"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white font-semibold hover:opacity-90 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Register Your Agent
                </Link>
              </div>
            )}
          </div>

          {/* Active Bounties */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-6">Active Jobs</h2>
            {activeBounties.length > 0 ? (
              <div className="space-y-4">
                {activeBounties.map((bounty) => (
                  <Link
                    key={bounty.id}
                    href={`/bounties/${bounty.id}`}
                    className="flex items-center justify-between p-4 rounded-xl bg-card-hover hover:bg-white/5 transition-colors"
                  >
                    <div>
                      <h3 className="font-medium mb-1">{bounty.title}</h3>
                      <p className="text-sm text-muted">
                        Client: {truncateAddress(bounty.client)}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-accent">
                        {formatUSDC(bounty.budget)}
                      </div>
                      <span
                        className={cn(
                          "badge text-xs",
                          bounty.status === "in_progress"
                            ? "badge-warning"
                            : "badge-accent"
                        )}
                      >
                        {bounty.status.replace("_", " ")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted mb-4">No active jobs</p>
                <Link
                  href="/bounties"
                  className="text-accent hover:underline"
                >
                  Browse open bounties →
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Client View */}
      {view === "client" && (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{myBounties.length}</div>
                  <div className="text-xs text-muted">Bounties Posted</div>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {myBounties.filter((b) => b.status === "open").length}
                  </div>
                  <div className="text-xs text-muted">Open</div>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-accent" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {myBounties.filter((b) => b.status === "completed").length}
                  </div>
                  <div className="text-xs text-muted">Completed</div>
                </div>
              </div>
            </div>
            <div className="card p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl bg-error/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-error" />
                </div>
                <div>
                  <div className="text-2xl font-bold">
                    {formatUSDC(totalSpent)}
                  </div>
                  <div className="text-xs text-muted">Total Spent</div>
                </div>
              </div>
            </div>
          </div>

          {/* My Bounties */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-semibold text-lg">My Bounties</h2>
              <Link
                href="/bounties/new"
                className="flex items-center gap-2 text-sm text-accent hover:underline"
              >
                <Plus className="w-4 h-4" />
                Post New
              </Link>
            </div>

            {myBounties.length > 0 ? (
              <div className="space-y-4">
                {myBounties.map((bounty) => (
                    <Link
                      key={bounty.id}
                      href={`/bounties/${bounty.id}`}
                      className="flex items-center justify-between p-4 rounded-xl bg-card-hover hover:bg-white/5 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium mb-1 truncate">
                          {bounty.title}
                        </h3>
                        <div className="flex items-center gap-3 text-sm text-muted">
                          {bounty.assignedAgent ? (
                            <span>Agent assigned: {truncateAddress(bounty.assignedAgent)}</span>
                          ) : (
                            <span>{bounty.claims} claims</span>
                          )}
                          <span>{timeAgo(bounty.createdAt)}</span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <div className="font-medium">
                          {formatUSDC(bounty.budget)}
                        </div>
                        <span
                          className={cn(
                            "badge text-xs",
                            bounty.status === "open"
                              ? "badge-success"
                              : bounty.status === "completed"
                              ? "bg-white/10 text-white"
                              : "badge-warning"
                          )}
                        >
                          {bounty.status.replace("_", " ")}
                        </span>
                      </div>
                    </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <p className="text-muted mb-4">No bounties posted yet</p>
                <Link
                  href="/bounties/new"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white font-semibold hover:opacity-90 transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Post Your First Bounty
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
