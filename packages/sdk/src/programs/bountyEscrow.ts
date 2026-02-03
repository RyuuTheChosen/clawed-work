import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram, SYSVAR_RENT_PUBKEY } from "@solana/web3.js";
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { BountyEscrowIDL } from "../idl";
import { BOUNTY_ESCROW_PROGRAM_ID } from "../constants/programs";

// Use `any` for the Program generic – the legacy IDL format is supported at
// runtime by Anchor 0.30 but its TS types expect the new IDL spec.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type BountyEscrowProgram = any;

export function getBountyEscrowProgram(provider: AnchorProvider): BountyEscrowProgram {
  return new Program(
    BountyEscrowIDL as any,
    provider
  );
}

export function deriveClientStatePDA(client: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("client"), client.toBuffer()],
    new PublicKey(BOUNTY_ESCROW_PROGRAM_ID)
  );
}

export function deriveBountyPDA(client: PublicKey, bountyId: number): [PublicKey, number] {
  const idBuffer = Buffer.alloc(8);
  idBuffer.writeBigUInt64LE(BigInt(bountyId));
  return PublicKey.findProgramAddressSync(
    [Buffer.from("bounty"), client.toBuffer(), idBuffer],
    new PublicKey(BOUNTY_ESCROW_PROGRAM_ID)
  );
}

export function deriveVaultPDA(bounty: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("vault"), bounty.toBuffer()],
    new PublicKey(BOUNTY_ESCROW_PROGRAM_ID)
  );
}

export async function initClient(program: BountyEscrowProgram): Promise<string> {
  const client = program.provider.publicKey!;
  const [clientStatePda] = deriveClientStatePDA(client);

  const tx = await program.methods
    .initClient()
    .accounts({
      clientState: clientStatePda,
      client,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

export async function createBounty(
  program: BountyEscrowProgram,
  metadataUri: string,
  budget: number,
  deadline: number,
  usdcMint: PublicKey
): Promise<string> {
  const client = program.provider.publicKey!;
  const [clientStatePda] = deriveClientStatePDA(client);

  // Fetch client state to get current bounty count
  let clientState;
  try {
    clientState = await program.account.clientState.fetch(clientStatePda);
  } catch {
    // Client state doesn't exist yet, init it first
    await initClient(program);
    clientState = await program.account.clientState.fetch(clientStatePda);
  }

  const bountyCount = clientState.bountyCount.toNumber();
  const [bountyPda] = deriveBountyPDA(client, bountyCount);
  const [vaultPda] = deriveVaultPDA(bountyPda);
  const clientTokenAccount = await getAssociatedTokenAddress(usdcMint, client);

  const tx = await program.methods
    .createBounty(metadataUri, new BN(budget), new BN(deadline))
    .accounts({
      clientState: clientStatePda,
      bounty: bountyPda,
      vault: vaultPda,
      client,
      clientTokenAccount,
      usdcMint,
      tokenProgram: TOKEN_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      rent: SYSVAR_RENT_PUBKEY,
    })
    .rpc();

  return tx;
}

export async function claimBounty(
  program: BountyEscrowProgram,
  bountyPda: PublicKey
): Promise<string> {
  const agent = program.provider.publicKey!;

  const tx = await program.methods
    .claimBounty()
    .accounts({
      bounty: bountyPda,
      agent,
    })
    .rpc();

  return tx;
}

export async function submitWork(
  program: BountyEscrowProgram,
  bountyPda: PublicKey,
  deliverableUri: string
): Promise<string> {
  const agent = program.provider.publicKey!;

  const tx = await program.methods
    .submitWork(deliverableUri)
    .accounts({
      bounty: bountyPda,
      agent,
    })
    .rpc();

  return tx;
}

export async function approveWork(
  program: BountyEscrowProgram,
  bountyPda: PublicKey
): Promise<string> {
  const client = program.provider.publicKey!;
  const bountyAccount = await program.account.bounty.fetch(bountyPda);
  const [vaultPda] = deriveVaultPDA(bountyPda);
  const agentTokenAccount = await getAssociatedTokenAddress(
    bountyAccount.usdcMint,
    bountyAccount.assignedAgent
  );

  const tx = await program.methods
    .approveWork()
    .accounts({
      bounty: bountyPda,
      vault: vaultPda,
      agentTokenAccount,
      client,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return tx;
}

export async function disputeBounty(
  program: BountyEscrowProgram,
  bountyPda: PublicKey
): Promise<string> {
  const authority = program.provider.publicKey!;

  const tx = await program.methods
    .disputeBounty()
    .accounts({
      bounty: bountyPda,
      authority,
    })
    .rpc();

  return tx;
}

export async function cancelBounty(
  program: BountyEscrowProgram,
  bountyPda: PublicKey,
  usdcMint: PublicKey
): Promise<string> {
  const client = program.provider.publicKey!;
  const [vaultPda] = deriveVaultPDA(bountyPda);
  const clientTokenAccount = await getAssociatedTokenAddress(usdcMint, client);

  const tx = await program.methods
    .cancelBounty()
    .accounts({
      bounty: bountyPda,
      vault: vaultPda,
      clientTokenAccount,
      client,
      tokenProgram: TOKEN_PROGRAM_ID,
    })
    .rpc();

  return tx;
}

export function deriveReviewPDA(bounty: PublicKey): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("review"), bounty.toBuffer()],
    new PublicKey(BOUNTY_ESCROW_PROGRAM_ID)
  );
}

export async function leaveReview(
  program: BountyEscrowProgram,
  bountyPda: PublicKey,
  rating: number,
  commentUri: string
): Promise<string> {
  const client = program.provider.publicKey!;
  const [reviewPda] = deriveReviewPDA(bountyPda);

  const tx = await program.methods
    .leaveReview(new BN(rating), commentUri)
    .accounts({
      bounty: bountyPda,
      review: reviewPda,
      client,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return tx;
}

export interface ReviewAccount {
  bounty: PublicKey;
  reviewer: PublicKey;
  agent: PublicKey;
  rating: BN;
  commentUri: string;
  bump: number;
  createdAt: BN;
}

export async function fetchReview(
  program: BountyEscrowProgram,
  bountyPda: PublicKey
): Promise<ReviewAccount | null> {
  const [reviewPda] = deriveReviewPDA(bountyPda);
  try {
    const account = await program.account.review.fetch(reviewPda);
    return account as ReviewAccount;
  } catch {
    return null;
  }
}

export async function fetchReviewsForAgent(
  program: BountyEscrowProgram,
  agent: PublicKey
): Promise<{ publicKey: PublicKey; account: ReviewAccount }[]> {
  const accounts = await program.account.review.all([
    {
      memcmp: {
        offset: 8 + 32 + 32, // discriminator + bounty + reviewer => agent field
        bytes: agent.toBase58(),
      },
    },
  ]);
  return accounts as { publicKey: PublicKey; account: ReviewAccount }[];
}

export interface BountyAccount {
  client: PublicKey;
  bountyId: BN;
  metadataUri: string;
  budget: BN;
  deadline: BN;
  status: number;
  claims: BN;
  assignedAgent: PublicKey;
  deliverableUri: string;
  vault: PublicKey;
  usdcMint: PublicKey;
  bump: number;
  createdAt: BN;
}

export async function fetchBounty(
  program: BountyEscrowProgram,
  bountyPda: PublicKey
): Promise<BountyAccount | null> {
  try {
    const account = await program.account.bounty.fetch(bountyPda);
    return account as BountyAccount;
  } catch {
    return null;
  }
}

export async function fetchAllBounties(
  program: BountyEscrowProgram
): Promise<{ publicKey: PublicKey; account: BountyAccount }[]> {
  const accounts = await program.account.bounty.all();
  return accounts as { publicKey: PublicKey; account: BountyAccount }[];
}

export async function fetchBountiesByClient(
  program: BountyEscrowProgram,
  client: PublicKey
): Promise<{ publicKey: PublicKey; account: BountyAccount }[]> {
  const accounts = await program.account.bounty.all([
    {
      memcmp: {
        offset: 8, // discriminator
        bytes: client.toBase58(),
      },
    },
  ]);
  return accounts as { publicKey: PublicKey; account: BountyAccount }[];
}
