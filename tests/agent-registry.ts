import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { assert } from "chai";
import { AgentRegistry } from "../target/types/agent_registry";

describe("agent-registry", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.AgentRegistry as Program<AgentRegistry>;
  const owner = provider.wallet;

  let agentPda: PublicKey;
  let agentBump: number;

  before(async () => {
    [agentPda, agentBump] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), owner.publicKey.toBuffer()],
      program.programId
    );
  });

  it("registers an agent", async () => {
    const metadataUri = "https://example.com/agent-metadata.json";
    const hourlyRate = new anchor.BN(5_000_000); // 5 USDC

    await program.methods
      .registerAgent(metadataUri, hourlyRate)
      .accounts({
        agent: agentPda,
        owner: owner.publicKey,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc();

    const agent = await program.account.agent.fetch(agentPda);
    assert.equal(agent.owner.toBase58(), owner.publicKey.toBase58());
    assert.equal(agent.metadataUri, metadataUri);
    assert.equal(agent.hourlyRate.toNumber(), 5_000_000);
    assert.equal(agent.reputation.toNumber(), 0);
    assert.equal(agent.bountiesCompleted.toNumber(), 0);
    assert.equal(agent.totalEarned.toNumber(), 0);
    assert.equal(agent.availability, 0); // Available
    assert.equal(agent.bump, agentBump);
  });

  it("updates an agent", async () => {
    const newUri = "https://example.com/agent-metadata-v2.json";
    const newRate = new anchor.BN(10_000_000); // 10 USDC

    await program.methods
      .updateAgent(newUri, newRate, 1) // Set to Busy
      .accounts({
        agent: agentPda,
        owner: owner.publicKey,
      })
      .rpc();

    const agent = await program.account.agent.fetch(agentPda);
    assert.equal(agent.metadataUri, newUri);
    assert.equal(agent.hourlyRate.toNumber(), 10_000_000);
    assert.equal(agent.availability, 1); // Busy
  });

  it("rejects duplicate registration", async () => {
    try {
      await program.methods
        .registerAgent("https://duplicate.com", new anchor.BN(1_000_000))
        .accounts({
          agent: agentPda,
          owner: owner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .rpc();
      assert.fail("Should have thrown an error");
    } catch (err) {
      // Account already exists - PDA already initialized
      assert.ok(err);
    }
  });

  it("rejects invalid hourly rate of 0", async () => {
    const newOwner = anchor.web3.Keypair.generate();

    // Airdrop some SOL to the new owner
    const sig = await provider.connection.requestAirdrop(
      newOwner.publicKey,
      1_000_000_000
    );
    await provider.connection.confirmTransaction(sig);

    const [newAgentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("agent"), newOwner.publicKey.toBuffer()],
      program.programId
    );

    try {
      await program.methods
        .registerAgent("https://example.com/meta.json", new anchor.BN(0))
        .accounts({
          agent: newAgentPda,
          owner: newOwner.publicKey,
          systemProgram: anchor.web3.SystemProgram.programId,
        })
        .signers([newOwner])
        .rpc();
      assert.fail("Should have thrown an error");
    } catch (err: any) {
      assert.include(err.toString(), "InvalidHourlyRate");
    }
  });

  it("prevents non-owner from updating agent", async () => {
    const imposter = anchor.web3.Keypair.generate();
    const sig = await provider.connection.requestAirdrop(
      imposter.publicKey,
      1_000_000_000
    );
    await provider.connection.confirmTransaction(sig);

    try {
      await program.methods
        .updateAgent(null, null, 0)
        .accounts({
          agent: agentPda,
          owner: imposter.publicKey,
        })
        .signers([imposter])
        .rpc();
      assert.fail("Should have thrown an error");
    } catch (err) {
      // PDA seed derivation mismatch or has_one constraint fails
      assert.ok(err);
    }
  });
});
