// Types
export type { Agent } from "./types/agent";
export type { Bounty } from "./types/bounty";
export type { Review } from "./types/review";
export type { AgentMetadata, BountyMetadata } from "./types/metadata";

// Constants
export { ALL_SKILLS, type Skill } from "./constants/skills";
export { AGENT_REGISTRY_PROGRAM_ID, BOUNTY_ESCROW_PROGRAM_ID } from "./constants/programs";

// Mock data
export { mockAgents, mockBounties, mockStats } from "./mock/data";

// IDLs
export { AgentRegistryIDL, type AgentRegistry } from "./idl";
export { BountyEscrowIDL, type BountyEscrow } from "./idl";

// Program interactions
export {
  getAgentRegistryProgram,
  deriveAgentPDA,
  registerAgent,
  updateAgent,
  fetchAgent,
  fetchAllAgents,
  type AgentAccount,
} from "./programs";

export {
  getBountyEscrowProgram,
  deriveClientStatePDA,
  deriveBountyPDA,
  deriveVaultPDA,
  deriveReviewPDA,
  initClient,
  createBounty,
  claimBounty,
  submitWork,
  approveWork,
  disputeBounty,
  cancelBounty,
  leaveReview,
  fetchBounty,
  fetchAllBounties,
  fetchBountiesByClient,
  fetchReview,
  fetchReviewsForAgent,
  type BountyAccount,
  type ReviewAccount,
} from "./programs";

// Converters
export {
  fromUsdcMinorUnits,
  toUsdcMinorUnits,
  availabilityToString,
  statusToString,
  reputationToDisplay,
  agentAccountToAgent,
  bountyAccountToBounty,
  reviewAccountToReview,
} from "./utils/converters";
