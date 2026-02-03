import Link from "next/link";
import Image from "next/image";
import { Star, ExternalLink, Clock, CheckCircle } from "lucide-react";
import { cn, formatUSDC, generateAvatar } from "@/lib/utils";
import type { Agent } from "@clawwork/sdk";

interface AgentCardProps {
  agent: Agent;
}

export function AgentCard({ agent }: AgentCardProps) {
  const availabilityColors = {
    available: "bg-success",
    busy: "bg-warning",
    offline: "bg-muted",
  };

  return (
    <Link href={`/agents/${agent.address}`}>
      <div className="card p-5 h-full flex flex-col hover:glow-accent cursor-pointer">
        {/* Header */}
        <div className="flex items-start gap-4 mb-4">
          <div className="relative">
            <Image
              src={generateAvatar(agent.address)}
              alt={agent.name}
              width={56}
              height={56}
              className="w-14 h-14 rounded-xl bg-card"
            />
            <div
              className={cn(
                "absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-card",
                availabilityColors[agent.availability]
              )}
            />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-lg truncate">{agent.name}</h3>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 text-accent fill-accent" />
                <span className="text-sm font-medium">{agent.reputation.toFixed(1)}</span>
              </div>
              <span className="text-muted text-sm">•</span>
              <span className="text-muted text-sm">{agent.bountiesCompleted} completed</span>
            </div>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-muted line-clamp-2 mb-4 flex-1">
          {agent.description}
        </p>

        {/* Skills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {agent.skills.slice(0, 3).map((skill) => (
            <span key={skill} className="badge badge-accent">
              {skill}
            </span>
          ))}
          {agent.skills.length > 3 && (
            <span className="badge bg-white/5 text-muted">
              +{agent.skills.length - 3}
            </span>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="flex items-center gap-1 text-sm">
            <Clock className="w-4 h-4 text-muted" />
            <span className="font-medium">{formatUSDC(agent.hourlyRate)}</span>
            <span className="text-muted">/hr</span>
          </div>
          <div className="flex items-center gap-1 text-sm text-muted">
            <CheckCircle className="w-4 h-4" />
            {formatUSDC(agent.totalEarned)} earned
          </div>
        </div>

        {/* Moltbook link */}
        {agent.moltbookUsername && (
          <div className="mt-3 pt-3 border-t border-border">
            <span className="text-xs text-muted flex items-center gap-1">
              <ExternalLink className="w-3 h-3" />
              @{agent.moltbookUsername} on Moltbook
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}

export function AgentCardSkeleton() {
  return (
    <div className="card p-5 animate-pulse">
      <div className="flex items-start gap-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-border" />
        <div className="flex-1">
          <div className="h-5 bg-border rounded w-32 mb-2" />
          <div className="h-4 bg-border rounded w-24" />
        </div>
      </div>
      <div className="h-10 bg-border rounded mb-4" />
      <div className="flex gap-2 mb-4">
        <div className="h-6 bg-border rounded-full w-16" />
        <div className="h-6 bg-border rounded-full w-20" />
      </div>
      <div className="h-4 bg-border rounded w-full" />
    </div>
  );
}
