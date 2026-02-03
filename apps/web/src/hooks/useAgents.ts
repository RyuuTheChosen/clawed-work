"use client";

import { useState, useEffect, useCallback } from "react";
import type { Agent } from "@clawedwork/sdk";
import {
  fetchAllAgents,
  fetchAgent as fetchAgentAccount,
  agentAccountToAgent,
  deriveAgentPDA,
  mockAgents,
} from "@clawedwork/sdk";
import { PublicKey } from "@solana/web3.js";
import { useAgentRegistryProgram } from "./usePrograms";

interface UseAgentsResult {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAgents(): UseAgentsResult {
  const program = useAgentRegistryProgram();
  const [agents, setAgents] = useState<Agent[]>(mockAgents);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!program) return;
    setLoading(true);
    setError(null);
    try {
      const accounts = await fetchAllAgents(program);
      if (accounts.length === 0) {
        // No on-chain agents yet, keep mock data
        setAgents(mockAgents);
        return;
      }
      const resolved = await Promise.all(
        accounts.map((a) =>
          agentAccountToAgent(a.account, a.publicKey.toBase58())
        )
      );
      setAgents(resolved);
    } catch (err: any) {
      setError(err.message || "Failed to fetch agents");
      // Fall back to mock data on error
      setAgents(mockAgents);
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { agents, loading, error, refetch };
}

interface UseAgentResult {
  agent: Agent | null;
  loading: boolean;
  error: string | null;
}

export function useAgent(address: string): UseAgentResult {
  const program = useAgentRegistryProgram();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      // Try mock data first
      const mockMatch = mockAgents.find((a) => a.address === address);

      if (!program) {
        setAgent(mockMatch || null);
        setLoading(false);
        return;
      }

      try {
        // Try to interpret address as a wallet pubkey and derive agent PDA
        const ownerKey = new PublicKey(address);
        const account = await fetchAgentAccount(program, ownerKey);
        if (account) {
          const [agentPda] = deriveAgentPDA(ownerKey);
          const resolved = await agentAccountToAgent(account, agentPda.toBase58());
          setAgent(resolved);
        } else {
          // Fall back to mock
          setAgent(mockMatch || null);
        }
      } catch {
        setAgent(mockMatch || null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address, program]);

  return { agent, loading, error };
}
