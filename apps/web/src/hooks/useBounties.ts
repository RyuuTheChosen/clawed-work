"use client";

import { useState, useEffect, useCallback } from "react";
import type { Bounty } from "@clawedwork/sdk";
import {
  fetchAllBounties,
  fetchBounty as fetchBountyAccount,
  fetchBountiesByClient,
  bountyAccountToBounty,
  mockBounties,
} from "@clawedwork/sdk";
import { PublicKey } from "@solana/web3.js";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBountyEscrowProgram } from "./usePrograms";
import { getCached, setCache } from "@/lib/rpc-cache";

const CACHE_KEY_ALL = "bounties:all";
const bountyCacheKey = (id: string) => `bounties:${id}`;
const myBountiesCacheKey = (wallet: string) => `bounties:my:${wallet}`;

interface UseBountiesResult {
  bounties: Bounty[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useBounties(): UseBountiesResult {
  const program = useBountyEscrowProgram();
  const [bounties, setBounties] = useState<Bounty[]>(() => {
    const cached = getCached<Bounty[]>(CACHE_KEY_ALL);
    return cached ? cached.data : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const refetch = useCallback(() => setFetchTrigger((n) => n + 1), []);

  useEffect(() => {
    if (!program) return;

    const cached = getCached<Bounty[]>(CACHE_KEY_ALL);
    if (cached && !cached.stale && fetchTrigger === 0) {
      setBounties(cached.data);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const accounts = await fetchAllBounties(program!);
        if (cancelled) return;
        if (accounts.length === 0) {
          setBounties(mockBounties);
          return;
        }
        const resolved = await Promise.all(
          accounts.map((a) =>
            bountyAccountToBounty(a.account, a.publicKey.toBase58(), controller.signal)
          )
        );
        if (!cancelled) {
          setBounties(resolved);
          setCache(CACHE_KEY_ALL, resolved);
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || "Failed to fetch bounties");
        setBounties(mockBounties);
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

  return { bounties, loading, error, refetch };
}

interface UseBountyResult {
  bounty: Bounty | null;
  loading: boolean;
  error: string | null;
}

export function useBounty(id: string): UseBountyResult {
  const program = useBountyEscrowProgram();
  const [bounty, setBounty] = useState<Bounty | null>(() => {
    const cached = getCached<Bounty>(bountyCacheKey(id));
    return cached ? cached.data : null;
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = getCached<Bounty>(bountyCacheKey(id));
    if (cached && !cached.stale) {
      setBounty(cached.data);
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);

      const mockMatch = mockBounties.find((b) => b.id === id);

      if (!program) {
        if (!cancelled) {
          setBounty(mockMatch || null);
          setLoading(false);
        }
        return;
      }

      try {
        const bountyKey = new PublicKey(id);
        const account = await fetchBountyAccount(program, bountyKey);
        if (cancelled) return;
        if (account) {
          const resolved = await bountyAccountToBounty(account, id, controller.signal);
          if (!cancelled) {
            setBounty(resolved);
            setCache(bountyCacheKey(id), resolved);
          }
        } else {
          if (!cancelled) setBounty(mockMatch || null);
        }
      } catch {
        if (!cancelled) setBounty(mockMatch || null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [id, program]);

  return { bounty, loading, error };
}

export function useMyBounties(): UseBountiesResult {
  const program = useBountyEscrowProgram();
  const { publicKey } = useWallet();
  const walletStr = publicKey?.toBase58() || "";
  const [bounties, setBounties] = useState<Bounty[]>(() => {
    if (!walletStr) return [];
    const cached = getCached<Bounty[]>(myBountiesCacheKey(walletStr));
    return cached ? cached.data : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const refetch = useCallback(() => setFetchTrigger((n) => n + 1), []);

  useEffect(() => {
    if (!program || !publicKey) return;

    const cacheKey = myBountiesCacheKey(publicKey.toBase58());
    const cached = getCached<Bounty[]>(cacheKey);
    if (cached && !cached.stale && fetchTrigger === 0) {
      setBounties(cached.data);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const accounts = await fetchBountiesByClient(program!, publicKey!);
        if (cancelled) return;
        const resolved = await Promise.all(
          accounts.map((a) =>
            bountyAccountToBounty(a.account, a.publicKey.toBase58(), controller.signal)
          )
        );
        if (!cancelled) {
          setBounties(resolved);
          setCache(cacheKey, resolved);
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || "Failed to fetch bounties");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [program, publicKey, fetchTrigger]);

  return { bounties, loading, error, refetch };
}
