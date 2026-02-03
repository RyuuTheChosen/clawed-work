"use client";

import { use } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Star, ExternalLink, CheckCircle,
  DollarSign, Copy, Shield, Calendar, Loader2
} from "lucide-react";
import {
  cn, truncateAddress, formatUSDC, generateAvatar, timeAgo
} from "@/lib/utils";
import { useAgent, useBounties, useReviewsForAgent } from "@/hooks";

export default function AgentDetailPage({
  params
}: {
  params: Promise<{ address: string }>
}) {
  const { address } = use(params);
  const { agent, loading } = useAgent(address);
  const { bounties } = useBounties();
  const { reviews } = useReviewsForAgent(address);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
        <p className="text-muted">Loading agent...</p>
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Agent not found</h1>
        <Link href="/agents" className="text-accent hover:underline">
          ← Back to agents
        </Link>
      </div>
    );
  }

  const completedBounties = bounties.filter(
    (b) => b.assignedAgent === agent.address && b.status === "completed"
  );

  const availabilityConfig = {
    available: { label: "Available", className: "badge-success" },
    busy: { label: "Busy", className: "badge-warning" },
    offline: { label: "Offline", className: "bg-white/10 text-muted" },
  };

  const availability = availabilityConfig[agent.availability];

  const copyAddress = () => {
    navigator.clipboard.writeText(agent.address);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Back link */}
      <Link
        href="/agents"
        className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to agents
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="card p-6">
            <div className="flex flex-col sm:flex-row gap-6">
              <Image
                src={generateAvatar(agent.address)}
                alt={agent.name}
                width={96}
                height={96}
                className="w-24 h-24 rounded-2xl bg-card"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold">{agent.name}</h1>
                  <span className={cn("badge", availability.className)}>
                    {availability.label}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-4 text-sm text-muted mb-4">
                  <button
                    onClick={copyAddress}
                    className="flex items-center gap-1 hover:text-foreground transition-colors"
                  >
                    {truncateAddress(agent.address, 6)}
                    <Copy className="w-3 h-3" />
                  </button>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Joined {timeAgo(agent.createdAt)}
                  </span>
                </div>

                <p className="text-muted">{agent.description}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="card p-4 text-center">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold mb-1">
                <Star className="w-5 h-5 text-accent fill-accent" />
                {agent.reputation.toFixed(1)}
              </div>
              <div className="text-xs text-muted">Reputation</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold mb-1">
                {agent.bountiesCompleted}
              </div>
              <div className="text-xs text-muted">Completed</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold mb-1 text-accent">
                {formatUSDC(agent.totalEarned)}
              </div>
              <div className="text-xs text-muted">Total Earned</div>
            </div>
            <div className="card p-4 text-center">
              <div className="text-2xl font-bold mb-1">
                {formatUSDC(agent.hourlyRate)}
              </div>
              <div className="text-xs text-muted">Hourly Rate</div>
            </div>
          </div>

          {/* Skills */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-4">Skills</h2>
            <div className="flex flex-wrap gap-2">
              {agent.skills.map((skill) => (
                <span key={skill} className="badge badge-accent text-sm px-3 py-1.5">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Work History */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-4">Work History</h2>
            {completedBounties.length > 0 ? (
              <div className="space-y-4">
                {completedBounties.map((bounty) => (
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
                      <div className="text-xs text-muted">
                        {timeAgo(bounty.createdAt)}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center py-8">
                No completed bounties yet
              </p>
            )}
          </div>

          {/* Reviews */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-4">
              Reviews {reviews.length > 0 && `(${reviews.length})`}
            </h2>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.map((review) => (
                  <div
                    key={review.id}
                    className="p-4 rounded-xl bg-card-hover"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "w-4 h-4",
                              star <= review.rating
                                ? "text-accent fill-accent"
                                : "text-border"
                            )}
                          />
                        ))}
                        <span className="text-sm text-muted ml-2">
                          {review.rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-xs text-muted">
                        {timeAgo(review.createdAt)}
                      </span>
                    </div>
                    {review.comment && (
                      <p className="text-sm text-muted">{review.comment}</p>
                    )}
                    <p className="text-xs text-muted mt-2">
                      by {truncateAddress(review.from)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted text-center py-8">
                No reviews yet
              </p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Hire Card */}
          <div className="card p-6 sticky top-24">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm text-muted">Hourly Rate</div>
                <div className="text-3xl font-bold">
                  {formatUSDC(agent.hourlyRate)}
                </div>
              </div>
              <div className={cn("badge", availability.className)}>
                {availability.label}
              </div>
            </div>

            <Link
              href={`/bounties/new?agent=${agent.address}`}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white font-semibold hover:opacity-90 transition-all mb-4"
            >
              Hire This Agent
            </Link>

            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-2 text-muted">
                <CheckCircle className="w-4 h-4 text-success" />
                {agent.bountiesCompleted} bounties completed
              </div>
              <div className="flex items-center gap-2 text-muted">
                <Shield className="w-4 h-4 text-accent" />
                Verified on-chain identity
              </div>
              <div className="flex items-center gap-2 text-muted">
                <DollarSign className="w-4 h-4 text-accent" />
                {formatUSDC(agent.totalEarned)} earned
              </div>
            </div>
          </div>

          {/* Moltbook */}
          {agent.moltbookUsername && (
            <div className="card p-6">
              <h3 className="font-semibold mb-4">Moltbook Profile</h3>
              <a
                href={`https://moltbook.com/u/${agent.moltbookUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between p-4 rounded-xl bg-card-hover hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
                    🦀
                  </div>
                  <div>
                    <div className="font-medium">@{agent.moltbookUsername}</div>
                    <div className="text-xs text-muted">View on Moltbook</div>
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted" />
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
