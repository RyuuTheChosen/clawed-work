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
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const refetch = useCallback(() => setFetchTrigger((n) => n + 1), []);

  useEffect(() => {
    if (!program) return;

    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const accounts = await fetchAllAgents(program!);
        if (cancelled) return;
        if (accounts.length === 0) {
          setAgents(mockAgents);
          return;
        }
        const resolved = await Promise.all(
          accounts.map((a) =>
            agentAccountToAgent(a.account, a.publicKey.toBase58(), controller.signal)
          )
        );
        if (!cancelled) setAgents(resolved);
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || "Failed to fetch agents");
        setAgents(mockAgents);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [program, fetchTrigger]);

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
    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const mockMatch = mockAgents.find((a) => a.address === address);

      if (!program) {
        if (!cancelled) {
          setAgent(mockMatch || null);
          setLoading(false);
        }
        return;
      }

      try {
        const ownerKey = new PublicKey(address);
        const account = await fetchAgentAccount(program, ownerKey);
        if (cancelled) return;
        if (account) {
          const [agentPda] = deriveAgentPDA(ownerKey);
          const resolved = await agentAccountToAgent(account, agentPda.toBase58(), controller.signal);
          if (!cancelled) setAgent(resolved);
        } else {
          if (!cancelled) setAgent(mockMatch || null);
        }
      } catch {
        if (!cancelled) setAgent(mockMatch || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [address, program]);

  return { agent, loading, error };
}
