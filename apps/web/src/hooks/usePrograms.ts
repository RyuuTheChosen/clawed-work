"use client";

import { useMemo } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import {
  getAgentRegistryProgram,
  getBountyEscrowProgram,
  type AgentRegistry,
  type BountyEscrow,
} from "@clawwork/sdk";

export function useAnchorProvider(): AnchorProvider | null {
  const { connection } = useConnection();
  const wallet = useWallet();

  return useMemo(() => {
    if (!wallet.publicKey || !wallet.signTransaction || !wallet.signAllTransactions) {
      return null;
    }
    return new AnchorProvider(
      connection,
      {
        publicKey: wallet.publicKey,
        signTransaction: wallet.signTransaction,
        signAllTransactions: wallet.signAllTransactions,
      },
      { commitment: "confirmed" }
    );
  }, [connection, wallet]);
}

export function useAgentRegistryProgram(): Program<AgentRegistry> | null {
  const provider = useAnchorProvider();
  return useMemo(() => {
    if (!provider) return null;
    return getAgentRegistryProgram(provider);
  }, [provider]);
}

export function useBountyEscrowProgram(): Program<BountyEscrow> | null {
  const provider = useAnchorProvider();
  return useMemo(() => {
    if (!provider) return null;
    return getBountyEscrowProgram(provider);
  }, [provider]);
}
