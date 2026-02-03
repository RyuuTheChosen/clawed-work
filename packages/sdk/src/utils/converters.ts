import type { Agent } from "../types/agent";
import type { Bounty } from "../types/bounty";
import type { Review } from "../types/review";
import type { AgentMetadata, BountyMetadata } from "../types/metadata";
import type { AgentAccount } from "../programs/agentRegistry";
import type { BountyAccount, ReviewAccount } from "../programs/bountyEscrow";

const USDC_DECIMALS = 6;

/** Convert USDC minor units (6 decimals) to a human-readable number */
export function fromUsdcMinorUnits(minorUnits: number | bigint): number {
  return Number(minorUnits) / 10 ** USDC_DECIMALS;
}

/** Convert a human-readable USDC amount to minor units (6 decimals) */
export function toUsdcMinorUnits(amount: number): number {
  return Math.round(amount * 10 ** USDC_DECIMALS);
}

/** Convert on-chain availability u8 to display string */
export function availabilityToString(availability: number): "available" | "busy" | "offline" {
  switch (availability) {
    case 0:
      return "available";
    case 1:
      return "busy";
    case 2:
      return "offline";
    default:
      return "offline";
  }
}

/** Convert on-chain bounty status u8 to display string */
export function statusToString(
  status: number
): "open" | "claimed" | "in_progress" | "delivered" | "completed" | "disputed" | "cancelled" {
  switch (status) {
    case 0:
      return "open";
    case 1:
      return "claimed";
    case 2:
      return "delivered";
    case 3:
      return "completed";
    case 4:
      return "disputed";
    case 5:
      return "cancelled";
    default:
      return "open";
  }
}

/** Convert on-chain reputation (fixed-point * 100) to human-readable (e.g. 480 -> 4.80) */
export function reputationToDisplay(reputation: number): number {
  return reputation / 100;
}

/** Fetch JSON metadata from a URI. Returns null on failure. */
async function fetchMetadata<T>(uri: string): Promise<T | null> {
  try {
    const res = await fetch(uri);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Convert an on-chain Agent account + metadata into the SDK Agent type */
export async function agentAccountToAgent(
  account: AgentAccount,
  address: string
): Promise<Agent> {
  const metadata = await fetchMetadata<AgentMetadata>(account.metadataUri);

  return {
    address,
    name: metadata?.name ?? "Unknown Agent",
    description: metadata?.description ?? "",
    skills: metadata?.skills ?? [],
    hourlyRate: fromUsdcMinorUnits(account.hourlyRate.toNumber()),
    reputation: reputationToDisplay(account.reputation.toNumber()),
    bountiesCompleted: account.bountiesCompleted.toNumber(),
    totalEarned: fromUsdcMinorUnits(account.totalEarned.toNumber()),
    availability: availabilityToString(account.availability),
    moltbookUsername: metadata?.moltbookUsername,
    createdAt: new Date(account.createdAt.toNumber() * 1000).toISOString(),
  };
}

/** Convert an on-chain Review account into the SDK Review type */
export async function reviewAccountToReview(
  account: ReviewAccount,
  address: string
): Promise<Review> {
  let comment = "";
  if (account.commentUri) {
    try {
      const res = await fetch(account.commentUri);
      if (res.ok) {
        const data = await res.json();
        comment = data.comment ?? "";
      }
    } catch {
      comment = "";
    }
  }

  return {
    id: address,
    bountyId: account.bounty.toBase58(),
    from: account.reviewer.toBase58(),
    agent: account.agent.toBase58(),
    rating: reputationToDisplay(account.rating.toNumber()),
    comment,
    createdAt: new Date(account.createdAt.toNumber() * 1000).toISOString(),
  };
}

/** Convert an on-chain Bounty account + metadata into the SDK Bounty type */
export async function bountyAccountToBounty(
  account: BountyAccount,
  address: string
): Promise<Bounty> {
  const metadata = await fetchMetadata<BountyMetadata>(account.metadataUri);

  const assignedAgent = account.assignedAgent.toBase58();
  const isDefaultKey = assignedAgent === "11111111111111111111111111111111";

  return {
    id: address,
    title: metadata?.title ?? "Untitled Bounty",
    description: metadata?.description ?? "",
    requirements: metadata?.requirements ?? [],
    budget: fromUsdcMinorUnits(account.budget.toNumber()),
    deadline: new Date(account.deadline.toNumber() * 1000).toISOString(),
    skills: metadata?.skills ?? [],
    client: account.client.toBase58(),
    clientReputation: 0, // Not tracked on-chain per client yet
    status: statusToString(account.status),
    claims: account.claims.toNumber(),
    assignedAgent: isDefaultKey ? undefined : assignedAgent,
    createdAt: new Date(account.createdAt.toNumber() * 1000).toISOString(),
  };
}
