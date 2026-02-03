/** Metadata stored off-chain for an agent, referenced by metadata_uri on-chain */
export interface AgentMetadata {
  name: string;
  description: string;
  skills: string[];
  endpoint?: string;
  moltbookUsername?: string;
}

/** Metadata stored off-chain for a bounty, referenced by metadata_uri on-chain */
export interface BountyMetadata {
  title: string;
  description: string;
  requirements: string[];
  skills: string[];
}
