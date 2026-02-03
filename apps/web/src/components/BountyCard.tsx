import Link from "next/link";
import { Clock, Users, Star, DollarSign } from "lucide-react";
import { cn, formatUSDC, timeUntil, truncateAddress } from "@/lib/utils";
import type { Bounty } from "@clawedwork/sdk";

interface BountyCardProps {
  bounty: Bounty;
}

const statusConfig = {
  open: { label: "Open", className: "badge-success" },
  claimed: { label: "Claimed", className: "badge-warning" },
  in_progress: { label: "In Progress", className: "badge-warning" },
  delivered: { label: "Delivered", className: "badge-accent" },
  completed: { label: "Completed", className: "bg-white/10 text-white" },
  disputed: { label: "Disputed", className: "badge-error" },
  cancelled: { label: "Cancelled", className: "bg-white/10 text-muted" },
};

export function BountyCard({ bounty }: BountyCardProps) {
  const status = statusConfig[bounty.status];

  return (
    <Link href={`/bounties/${bounty.id}`}>
      <div className="card p-5 h-full flex flex-col hover:glow-accent cursor-pointer">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-3">
          <h3 className="font-semibold text-lg line-clamp-2 flex-1">
            {bounty.title}
          </h3>
          <span className={cn("badge whitespace-nowrap", status.className)}>
            {status.label}
          </span>
        </div>

        {/* Description */}
        <p className="text-sm text-muted line-clamp-2 mb-4 flex-1">
          {bounty.description}
        </p>

        {/* Skills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {bounty.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="badge badge-accent">
              {skill}
            </span>
          ))}
          {bounty.skills.length > 3 && (
            <span className="badge bg-white/5 text-muted">
              +{bounty.skills.length - 3}
            </span>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="flex items-center gap-2 text-sm">
            <DollarSign className="w-4 h-4 text-accent" />
            <span className="font-semibold">{formatUSDC(bounty.budget)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted">
            <Clock className="w-4 h-4" />
            <span>{timeUntil(bounty.deadline)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border text-sm">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-accent fill-accent" />
              <span>{bounty.clientReputation.toFixed(1)}</span>
            </div>
            <span className="text-muted">
              {truncateAddress(bounty.client)}
            </span>
          </div>
          <div className="flex items-center gap-1 text-muted">
            <Users className="w-4 h-4" />
            <span>{bounty.claims} claims</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export function BountyCardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="h-6 bg-border rounded w-3/4" />
        <div className="h-6 bg-border rounded-full w-16" />
      </div>
      <div className="h-10 bg-border rounded mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-border rounded-full w-16" />
        <div className="h-6 bg-border rounded-full w-20" />
      </div>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="h-5 bg-border rounded" />
        <div className="h-5 bg-border rounded" />
      </div>
      <div className="h-4 bg-border rounded w-full pt-4" />
    </div>
  );
}
