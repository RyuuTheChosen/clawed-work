"use client";

import { useState, useEffect, useCallback } from "react";
import type { Bounty } from "@clawwork/sdk";
import {
  fetchAllBounties,
  fetchBounty as fetchBountyAccount,
  fetchBountiesByClient,
  bountyAccountToBounty,
  mockBounties,
} from "@clawwork/sdk";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBountyEscrowProgram } from "./usePrograms";

interface UseBountiesResult {
  bounties: Bounty[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBounties(): UseBountiesResult {
  const program = useBountyEscrowProgram();
  const [bounties, setBounties] = useState<Bounty[]>(mockBounties);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!program) return;
    setLoading(true);
    setError(null);
    try {
      const accounts = await fetchAllBounties(program);
      if (accounts.length === 0) {
        setBounties(mockBounties);
        return;
      }
      const resolved = await Promise.all(
        accounts.map((a) =>
          bountyAccountToBounty(a.account, a.publicKey.toBase58())
        )
      );
      setBounties(resolved);
    } catch (err: any) {
      setError(err.message || "Failed to fetch bounties");
      setBounties(mockBounties);
    } finally {
      setLoading(false);
    }
  }, [program]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { bounties, loading, error, refetch };
}

interface UseBountyResult {
  bounty: Bounty | null;
  loading: boolean;
  error: string | null;
}

export function useBounty(id: string): UseBountyResult {
  const program = useBountyEscrowProgram();
  const [bounty, setBounty] = useState<Bounty | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);

      const mockMatch = mockBounties.find((b) => b.id === id);

      if (!program) {
        setBounty(mockMatch || null);
        setLoading(false);
        return;
      }

      try {
        const bountyKey = new PublicKey(id);
        const account = await fetchBountyAccount(program, bountyKey);
        if (account) {
          const resolved = await bountyAccountToBounty(account, id);
          setBounty(resolved);
        } else {
          setBounty(mockMatch || null);
        }
      } catch {
        setBounty(mockMatch || null);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, program]);

  return { bounty, loading, error };
}

export function useMyBounties(): UseBountiesResult {
  const program = useBountyEscrowProgram();
  const { publicKey } = useWallet();
  const [bounties, setBounties] = useState<Bounty[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!program || !publicKey) return;
    setLoading(true);
    setError(null);
    try {
      const accounts = await fetchBountiesByClient(program, publicKey);
      const resolved = await Promise.all(
        accounts.map((a) =>
          bountyAccountToBounty(a.account, a.publicKey.toBase58())
        )
      );
      setBounties(resolved);
    } catch (err: any) {
      setError(err.message || "Failed to fetch bounties");
    } finally {
      setLoading(false);
    }
  }, [program, publicKey]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { bounties, loading, error, refetch };
}
