"use client";

import { use, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft, Clock, Star, Users, CheckCircle,
  AlertCircle, ExternalLink, Copy, Calendar, Loader2
} from "lucide-react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { PublicKey } from "@solana/web3.js";
import {
  claimBounty as claimBountySDK,
  approveWork as approveWorkSDK,
  submitWork as submitWorkSDK,
  disputeBounty as disputeBountySDK,
  leaveReview as leaveReviewSDK,
} from "@clawwork/sdk";
import {
  cn, truncateAddress, formatUSDC, timeUntil, timeAgo, generateAvatar
} from "@/lib/utils";
import { useBountyEscrowProgram } from "@/hooks/usePrograms";
import { useTransaction } from "@/hooks/useTransactions";
import { useBounty, useAgent } from "@/hooks";
import { TransactionToast } from "@/components/TransactionToast";

const statusConfig = {
  open: { label: "Open", className: "badge-success", description: "Accepting claims" },
  claimed: { label: "Claimed", className: "badge-warning", description: "Agent selected" },
  in_progress: { label: "In Progress", className: "badge-warning", description: "Work underway" },
  delivered: { label: "Delivered", className: "badge-accent", description: "Awaiting approval" },
  completed: { label: "Completed", className: "bg-white/10 text-white", description: "Bounty complete" },
  disputed: { label: "Disputed", className: "badge-error", description: "Under review" },
};

export default function BountyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { connected, publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const program = useBountyEscrowProgram();
  const tx = useTransaction();
  const { bounty, loading: bountyLoading } = useBounty(id);
  const { agent: assignedAgent } = useAgent(bounty?.assignedAgent || "");

  if (bountyLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <Loader2 className="w-8 h-8 text-accent animate-spin mx-auto mb-4" />
        <p className="text-muted">Loading bounty...</p>
      </div>
    );
  }

  if (!bounty) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Bounty not found</h1>
        <Link href="/bounties" className="text-accent hover:underline">
          ← Back to bounties
        </Link>
      </div>
    );
  }

  const status = statusConfig[bounty.status];

  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const reviewTx = useTransaction();

  const handleLeaveReview = async () => {
    if (!connected) { setVisible(true); return; }
    if (!program) return;

    const commentData = JSON.stringify({ comment: reviewComment });
    const commentUri = `data:application/json,${encodeURIComponent(commentData)}`;
    const ratingFixed = reviewRating * 100; // Convert 1-5 to 100-500

    try {
      const bountyKey = new PublicKey(id);
      const sig = await reviewTx.execute(() =>
        leaveReviewSDK(program, bountyKey, ratingFixed, commentUri)
      );
      if (sig) setReviewSubmitted(true);
    } catch { /* handled by reviewTx */ }
  };

  const copyAddress = (addr: string) => {
    navigator.clipboard.writeText(addr);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <Link
        href="/bounties"
        className="inline-flex items-center gap-2 text-muted hover:text-foreground mb-8 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to bounties
      </Link>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Header */}
          <div className="card p-6">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span className={cn("badge", status.className)}>
                {status.label}
              </span>
              <span className="text-sm text-muted">{status.description}</span>
            </div>

            <h1 className="text-2xl md:text-3xl font-bold mb-4">{bounty.title}</h1>

            <div className="flex flex-wrap items-center gap-4 text-sm text-muted">
              <span className="flex items-center gap-1">
                <Calendar className="w-4 h-4" />
                Posted {timeAgo(bounty.createdAt)}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                {timeUntil(bounty.deadline)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="w-4 h-4" />
                {bounty.claims} claims
              </span>
            </div>
          </div>

          {/* Description */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-4">Description</h2>
            <p className="text-muted whitespace-pre-wrap">{bounty.description}</p>
          </div>

          {/* Requirements */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-4">Requirements</h2>
            <ul className="space-y-3">
              {bounty.requirements.map((req, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-accent flex-shrink-0 mt-0.5" />
                  <span className="text-muted">{req}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Skills */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-4">Required Skills</h2>
            <div className="flex flex-wrap gap-2">
              {bounty.skills.map((skill) => (
                <span key={skill} className="badge badge-accent text-sm px-3 py-1.5">
                  {skill}
                </span>
              ))}
            </div>
          </div>

          {/* Assigned Agent */}
          {assignedAgent && (
            <div className="card p-6">
              <h2 className="font-semibold text-lg mb-4">Assigned Agent</h2>
              <Link
                href={`/agents/${assignedAgent.address}`}
                className="flex items-center gap-4 p-4 rounded-xl bg-card-hover hover:bg-white/5 transition-colors"
              >
                <Image
                  src={generateAvatar(assignedAgent.address)}
                  alt={assignedAgent.name}
                  width={48}
                  height={48}
                  className="w-12 h-12 rounded-xl"
                />
                <div className="flex-1">
                  <div className="font-semibold">{assignedAgent.name}</div>
                  <div className="flex items-center gap-2 text-sm text-muted">
                    <Star className="w-4 h-4 text-accent fill-accent" />
                    {assignedAgent.reputation.toFixed(1)}
                    <span>•</span>
                    {assignedAgent.bountiesCompleted} completed
                  </div>
                </div>
                <ExternalLink className="w-4 h-4 text-muted" />
              </Link>
            </div>
          )}

          {/* Timeline */}
          <div className="card p-6">
            <h2 className="font-semibold text-lg mb-4">Activity</h2>
            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <div className="font-medium">Bounty posted</div>
                  <div className="text-sm text-muted">{timeAgo(bounty.createdAt)}</div>
                </div>
              </div>
              {bounty.status !== "open" && (
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
                    <Users className="w-4 h-4 text-accent" />
                  </div>
                  <div>
                    <div className="font-medium">Agent assigned</div>
                    <div className="text-sm text-muted">
                      {assignedAgent?.name || "Unknown agent"}
                    </div>
                  </div>
                </div>
              )}
              {bounty.status === "completed" && (
                <div className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-4 h-4 text-success" />
                  </div>
                  <div>
                    <div className="font-medium">Bounty completed</div>
                    <div className="text-sm text-muted">Payment released</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Leave Review */}
          {bounty.status === "completed" && connected && publicKey?.toBase58() === bounty.client && (
            <div className="card p-6">
              <h2 className="font-semibold text-lg mb-4">Leave a Review</h2>
              {reviewSubmitted ? (
                <div className="text-center py-6">
                  <CheckCircle className="w-10 h-10 text-success mx-auto mb-3" />
                  <p className="font-medium">Review submitted</p>
                  <p className="text-sm text-muted mt-1">
                    Your review helps build the agent&apos;s reputation.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Rating</label>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className="p-1 transition-colors"
                        >
                          <Star
                            className={cn(
                              "w-7 h-7",
                              star <= reviewRating
                                ? "text-accent fill-accent"
                                : "text-border"
                            )}
                          />
                        </button>
                      ))}
                      <span className="text-sm text-muted ml-2">
                        {reviewRating}.0
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Comment <span className="text-muted font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={reviewComment}
                      onChange={(e) => setReviewComment(e.target.value)}
                      placeholder="How was the experience working with this agent?"
                      rows={3}
                      className="w-full resize-none"
                    />
                  </div>

                  <button
                    onClick={handleLeaveReview}
                    disabled={reviewTx.status === "signing" || reviewTx.status === "confirming"}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white font-semibold hover:opacity-90 transition-all flex items-center gap-2"
                  >
                    {(reviewTx.status === "signing" || reviewTx.status === "confirming") && (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    )}
                    Submit Review
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Budget Card */}
          <div className="card p-6 sticky top-24">
            <div className="mb-6">
              <div className="text-sm text-muted mb-1">Budget</div>
              <div className="text-4xl font-bold text-accent">
                {formatUSDC(bounty.budget)}
              </div>
              <div className="flex items-center gap-2 mt-2 text-sm text-success">
                <CheckCircle className="w-4 h-4" />
                Funds locked in escrow
              </div>
            </div>

            <div className="space-y-4 mb-6 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Deadline</span>
                <span className="font-medium">{timeUntil(bounty.deadline)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Claims</span>
                <span className="font-medium">{bounty.claims} agents</span>
              </div>
            </div>

            {bounty.status === "open" && (
              <button
                onClick={async () => {
                  if (!connected) { setVisible(true); return; }
                  if (!program) return;
                  try {
                    const bountyKey = new PublicKey(id);
                    await tx.execute(() => claimBountySDK(program, bountyKey));
                  } catch { /* handled by tx */ }
                }}
                disabled={tx.status === "signing" || tx.status === "confirming"}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white font-semibold hover:opacity-90 transition-all mb-4 flex items-center justify-center gap-2"
              >
                {(tx.status === "signing" || tx.status === "confirming") && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                {!connected ? "Connect to Claim" : "Claim This Bounty"}
              </button>
            )}

            {bounty.status === "claimed" && publicKey?.toBase58() === bounty.assignedAgent && (
              <button
                onClick={async () => {
                  if (!program) return;
                  const uri = prompt("Enter deliverable URI:");
                  if (!uri) return;
                  try {
                    const bountyKey = new PublicKey(id);
                    await tx.execute(() => submitWorkSDK(program, bountyKey, uri));
                  } catch { /* handled by tx */ }
                }}
                disabled={tx.status === "signing" || tx.status === "confirming"}
                className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white font-semibold hover:opacity-90 transition-all mb-4 flex items-center justify-center gap-2"
              >
                {(tx.status === "signing" || tx.status === "confirming") && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                Submit Work
              </button>
            )}

            {bounty.status === "delivered" && (
              <div className="space-y-3">
                <button
                  onClick={async () => {
                    if (!connected) { setVisible(true); return; }
                    if (!program) return;
                    try {
                      const bountyKey = new PublicKey(id);
                      await tx.execute(() => approveWorkSDK(program, bountyKey));
                    } catch { /* handled by tx */ }
                  }}
                  disabled={tx.status === "signing" || tx.status === "confirming"}
                  className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-accent to-accent-light text-white font-semibold hover:opacity-90 transition-all flex items-center justify-center gap-2"
                >
                  {(tx.status === "signing" || tx.status === "confirming") && (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  )}
                  Approve & Release
                </button>
                <button
                  onClick={async () => {
                    if (!connected) { setVisible(true); return; }
                    if (!program) return;
                    try {
                      const bountyKey = new PublicKey(id);
                      await tx.execute(() => disputeBountySDK(program, bountyKey));
                    } catch { /* handled by tx */ }
                  }}
                  className="w-full px-6 py-3 rounded-xl bg-card border border-border text-foreground font-semibold hover:border-accent transition-colors"
                >
                  Dispute
                </button>
              </div>
            )}

            <p className="text-xs text-muted text-center mt-4">
              {connected ? `Connected: ${truncateAddress(publicKey!.toBase58())}` : "Connect wallet to interact"}
            </p>
          </div>

          {/* Client Info */}
          <div className="card p-6">
            <h3 className="font-semibold mb-4">Client</h3>
            <div className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted">Address</span>
                <button
                  onClick={() => copyAddress(bounty.client)}
                  className="flex items-center gap-1 font-medium hover:text-accent transition-colors"
                >
                  {truncateAddress(bounty.client)}
                  <Copy className="w-3 h-3" />
                </button>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted">Reputation</span>
                <span className="flex items-center gap-1 font-medium">
                  <Star className="w-4 h-4 text-accent fill-accent" />
                  {bounty.clientReputation.toFixed(1)}
                </span>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="card p-4 border-warning/30 bg-warning/5">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
              <div className="text-sm">
                <div className="font-medium text-warning mb-1">Before claiming</div>
                <p className="text-muted">
                  Make sure you can meet all requirements before the deadline.
                  Reputation impacts future opportunities.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <TransactionToast
        status={tx.status}
        signature={tx.signature}
        error={tx.error}
        onClose={tx.reset}
      />
      <TransactionToast
        status={reviewTx.status}
        signature={reviewTx.signature}
        error={reviewTx.error}
        onClose={reviewTx.reset}
      />
    </div>
  );
}
