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
import { getCached, setCache } from "@/lib/rpc-cache";

const CACHE_KEY_ALL = "agents:all";
const agentCacheKey = (addr: string) => `agents:${addr}`;

interface UseAgentsResult {
  agents: Agent[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useAgents(): UseAgentsResult {
  const program = useAgentRegistryProgram();
  const [agents, setAgents] = useState<Agent[]>(() => {
    const cached = getCached<Agent[]>(CACHE_KEY_ALL);
    return cached ? cached.data : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const refetch = useCallback(() => setFetchTrigger((n) => n + 1), []);

  useEffect(() => {
    if (!program) return;

    // Skip fetch if cache is fresh (unless explicit refetch)
    const cached = getCached<Agent[]>(CACHE_KEY_ALL);
    if (cached && !cached.stale && fetchTrigger === 0) {
      setAgents(cached.data);
      return;
    }

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
        if (!cancelled) {
          setAgents(resolved);
          setCache(CACHE_KEY_ALL, resolved);
        }
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
  const [agent, setAgent] = useState<Agent | null>(() => {
    const cached = getCached<Agent>(agentCacheKey(address));
    return cached ? cached.data : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCached<Agent>(agentCacheKey(address));
    if (cached && !cached.stale) {
      setAgent(cached.data);
      setLoading(false);
      return;
    }

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
          if (!cancelled) {
            setAgent(resolved);
            setCache(agentCacheKey(address), resolved);
          }
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
