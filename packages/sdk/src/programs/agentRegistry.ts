import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { AgentRegistryIDL, type AgentRegistry } from "../idl";
import { AGENT_REGISTRY_PROGRAM_ID } from "../constants/programs";

export function getAgentRegistryProgram(provider: AnchorProvider): Program<AgentRegistry> {
  return new Program<AgentRegistry>(
    AgentRegistryIDL,
    new PublicKey(AGENT_REGISTRY_PROGRAM_ID),
    provider
  );
}

export function deriveAgentPDA(owner: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("agent"), owner.toBuffer()],
    new PublicKey(AGENT_REGISTRY_PROGRAM_ID)
  );
}

export async function registerAgent(
  program: Program<AgentRegistry>,
  metadataUri: string,
  hourlyRate: number
): Promise<string> {
  const owner = program.provider.publicKey!;
  const [agentPda] = deriveAgentPDA(owner);

  const tx = await program.methods
    .registerAgent(metadataUri, new BN(hourlyRate))
    .accounts({
      agent: agentPda,
      owner,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

export async function updateAgent(
  program: Program<AgentRegistry>,
  metadataUri: string | null,
  hourlyRate: number | null,
  availability: number | null
): Promise<string> {
  const owner = program.provider.publicKey!;
  const [agentPda] = deriveAgentPDA(owner);

  const tx = await program.methods
    .updateAgent(
      metadataUri,
      hourlyRate !== null ? new BN(hourlyRate) : null,
      availability
    )
    .accounts({
      agent: agentPda,
      owner,
    })
    .rpc();

  return tx;
}

export interface AgentAccount {
  owner: PublicKey;
  metadataUri: string;
  hourlyRate: BN;
  reputation: BN;
  bountiesCompleted: BN;
  totalEarned: BN;
  availability: number;
  bump: number;
  createdAt: BN;
}

export async function fetchAgent(
  program: Program<AgentRegistry>,
  owner: PublicKey
): Promise<AgentAccount | null> {
  const [agentPda] = deriveAgentPDA(owner);
  try {
    const account = await program.account.agent.fetch(agentPda);
    return account as AgentAccount;
  } catch {
    return null;
  }
}

export async function fetchAllAgents(
  program: Program<AgentRegistry>
): Promise<{ publicKey: PublicKey; account: AgentAccount }[]> {
  const accounts = await program.account.agent.all();
  return accounts as { publicKey: PublicKey; account: AgentAccount }[];
}
