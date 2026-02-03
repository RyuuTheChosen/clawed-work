import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import {
  createMint,
  createAccount,
  mintTo,
  getAccount,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { assert } from "chai";
import { BountyEscrow } from "../target/types/bounty_escrow";

describe("bounty-escrow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.BountyEscrow as Program<BountyEscrow>;
  const client = provider.wallet;

  let usdcMint: PublicKey;
  let clientTokenAccount: PublicKey;
  let agentKeypair: Keypair;
  let agentTokenAccount: PublicKey;
  let clientStatePda: PublicKey;
  let bountyPda: PublicKey;
  let vaultPda: PublicKey;

  const BUDGET = 100_000_000; // 100 USDC (6 decimals)

  before(async () => {
    // Create test USDC mint
    usdcMint = await createMint(
      provider.connection,
      (provider.wallet as anchor.Wallet).payer,
      client.publicKey,
      null,
      6 // USDC has 6 decimals
    );

    // Create client token account and mint USDC
    clientTokenAccount = await createAccount(
      provider.connection,
      (provider.wallet as anchor.Wallet).payer,
      usdcMint,
      client.publicKey
    );

    await mintTo(
      provider.connection,
      (provider.wallet as anchor.Wallet).payer,
      usdcMint,
      clientTokenAccount,
      client.publicKey,
      1_000_000_000 // 1000 USDC
    );

    // Create agent keypair and token account
    agentKeypair = Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      agentKeypair.publicKey,
      2_000_000_000
    );
    await provider.connection.confirmTransaction(sig);

    agentTokenAccount = await createAccount(
      provider.connection,
      (provider.wallet as anchor.Wallet).payer,
      usdcMint,
      agentKeypair.publicKey
    );

    // Derive PDAs
    [clientStatePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("client"), client.publicKey.toBuffer()],
      program.programId
    );
  });

  it("initializes client state", async () => {
    await program.methods
      .initClient()
      .accounts({
        clientState: clientStatePda,
        client: client.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const state = await program.account.clientState.fetch(clientStatePda);
    assert.equal(state.owner.toBase58(), client.publicKey.toBase58());
    assert.equal(state.bountyCount.toNumber(), 0);
  });

  it("creates a bounty with USDC escrow", async () => {
    const bountyId = new anchor.BN(0);

    [bountyPda] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bounty"),
        client.publicKey.toBuffer(),
        bountyId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    [vaultPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), bountyPda.toBuffer()],
      program.programId
    );

    const deadline = Math.floor(Date.now() / 1000) + 86400 * 7; // 7 days from now

    await program.methods
      .createBounty(
        "https://example.com/bounty-metadata.json",
        new anchor.BN(BUDGET),
        new anchor.BN(deadline)
      )
      .accounts({
        clientState: clientStatePda,
        bounty: bountyPda,
        vault: vaultPda,
        client: client.publicKey,
        clientTokenAccount,
        usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    // Verify bounty
    const bounty = await program.account.bounty.fetch(bountyPda);
    assert.equal(bounty.client.toBase58(), client.publicKey.toBase58());
    assert.equal(bounty.bountyId.toNumber(), 0);
    assert.equal(bounty.budget.toNumber(), BUDGET);
    assert.equal(bounty.status, 0); // Open

    // Verify USDC was transferred to vault
    const vaultAccount = await getAccount(provider.connection, vaultPda);
    assert.equal(Number(vaultAccount.amount), BUDGET);

    // Verify client state incremented
    const state = await program.account.clientState.fetch(clientStatePda);
    assert.equal(state.bountyCount.toNumber(), 1);
  });

  it("agent claims a bounty", async () => {
    await program.methods
      .claimBounty()
      .accounts({
        bounty: bountyPda,
        agent: agentKeypair.publicKey,
      })
      .signers([agentKeypair])
      .rpc();

    const bounty = await program.account.bounty.fetch(bountyPda);
    assert.equal(bounty.status, 1); // Claimed
    assert.equal(
      bounty.assignedAgent.toBase58(),
      agentKeypair.publicKey.toBase58()
    );
    assert.equal(bounty.claims.toNumber(), 1);
  });

  it("agent submits work", async () => {
    const deliverableUri = "https://example.com/deliverable.zip";

    await program.methods
      .submitWork(deliverableUri)
      .accounts({
        bounty: bountyPda,
        agent: agentKeypair.publicKey,
      })
      .signers([agentKeypair])
      .rpc();

    const bounty = await program.account.bounty.fetch(bountyPda);
    assert.equal(bounty.status, 2); // Delivered
    assert.equal(bounty.deliverableUri, deliverableUri);
  });

  it("client approves work and releases payment", async () => {
    const agentBalanceBefore = await getAccount(
      provider.connection,
      agentTokenAccount
    );

    await program.methods
      .approveWork()
      .accounts({
        bounty: bountyPda,
        vault: vaultPda,
        agentTokenAccount,
        client: client.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const bounty = await program.account.bounty.fetch(bountyPda);
    assert.equal(bounty.status, 3); // Completed

    // Verify agent received payment
    const agentBalanceAfter = await getAccount(
      provider.connection,
      agentTokenAccount
    );
    assert.equal(
      Number(agentBalanceAfter.amount) - Number(agentBalanceBefore.amount),
      BUDGET
    );
  });

  it("creates and cancels a bounty with refund", async () => {
    const bountyId = new anchor.BN(1); // second bounty

    const [bountyPda2] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bounty"),
        client.publicKey.toBuffer(),
        bountyId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const [vaultPda2] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), bountyPda2.toBuffer()],
      program.programId
    );

    const deadline = Math.floor(Date.now() / 1000) + 86400 * 7;
    const cancelBudget = 50_000_000; // 50 USDC

    const clientBalanceBefore = await getAccount(
      provider.connection,
      clientTokenAccount
    );

    // Create bounty
    await program.methods
      .createBounty(
        "https://example.com/bounty-cancel.json",
        new anchor.BN(cancelBudget),
        new anchor.BN(deadline)
      )
      .accounts({
        clientState: clientStatePda,
        bounty: bountyPda2,
        vault: vaultPda2,
        client: client.publicKey,
        clientTokenAccount,
        usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    // Cancel bounty
    await program.methods
      .cancelBounty()
      .accounts({
        bounty: bountyPda2,
        vault: vaultPda2,
        clientTokenAccount,
        client: client.publicKey,
        tokenProgram: TOKEN_PROGRAM_ID,
      })
      .rpc();

    const bounty = await program.account.bounty.fetch(bountyPda2);
    assert.equal(bounty.status, 5); // Cancelled

    // Verify refund
    const clientBalanceAfter = await getAccount(
      provider.connection,
      clientTokenAccount
    );
    assert.equal(
      Number(clientBalanceAfter.amount),
      Number(clientBalanceBefore.amount)
    );
  });

  it("rejects unauthorized dispute", async () => {
    // Create a new bounty for dispute testing
    const bountyId = new anchor.BN(2);

    const [bountyPda3] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bounty"),
        client.publicKey.toBuffer(),
        bountyId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const [vaultPda3] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), bountyPda3.toBuffer()],
      program.programId
    );

    const deadline = Math.floor(Date.now() / 1000) + 86400 * 7;

    await program.methods
      .createBounty(
        "https://example.com/bounty-dispute.json",
        new anchor.BN(25_000_000),
        new anchor.BN(deadline)
      )
      .accounts({
        clientState: clientStatePda,
        bounty: bountyPda3,
        vault: vaultPda3,
        client: client.publicKey,
        clientTokenAccount,
        usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    // Try to dispute an open bounty (should fail - can only dispute claimed/delivered)
    try {
      await program.methods
        .disputeBounty()
        .accounts({
          bounty: bountyPda3,
          authority: client.publicKey,
        })
        .rpc();
      assert.fail("Should have thrown an error");
    } catch (err: any) {
      assert.include(err.toString(), "CannotDispute");
    }
  });

  it("allows client to dispute a claimed bounty", async () => {
    // Create, claim, then dispute
    const bountyId = new anchor.BN(3);

    const [bountyPda4] = PublicKey.findProgramAddressSync(
      [
        Buffer.from("bounty"),
        client.publicKey.toBuffer(),
        bountyId.toArrayLike(Buffer, "le", 8),
      ],
      program.programId
    );

    const [vaultPda4] = PublicKey.findProgramAddressSync(
      [Buffer.from("vault"), bountyPda4.toBuffer()],
      program.programId
    );

    const deadline = Math.floor(Date.now() / 1000) + 86400 * 7;

    await program.methods
      .createBounty(
        "https://example.com/bounty-dispute2.json",
        new anchor.BN(25_000_000),
        new anchor.BN(deadline)
      )
      .accounts({
        clientState: clientStatePda,
        bounty: bountyPda4,
        vault: vaultPda4,
        client: client.publicKey,
        clientTokenAccount,
        usdcMint,
        tokenProgram: TOKEN_PROGRAM_ID,
        systemProgram: anchor.web3.SystemProgram.programId,
        rent: anchor.web3.SYSVAR_RENT_PUBKEY,
      })
      .rpc();

    // Claim
    await program.methods
      .claimBounty()
      .accounts({
        bounty: bountyPda4,
        agent: agentKeypair.publicKey,
      })
      .signers([agentKeypair])
      .rpc();

    // Dispute
    await program.methods
      .disputeBounty()
      .accounts({
        bounty: bountyPda4,
        authority: client.publicKey,
      })
      .rpc();

    const bounty = await program.account.bounty.fetch(bountyPda4);
    assert.equal(bounty.status, 4); // Disputed
  });
});
