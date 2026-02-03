"use client";

import { useState, useEffect, useCallback } from "react";
import type { Review } from "@clawedwork/sdk";
import {
  fetchReviewsForAgent,
  reviewAccountToReview,
} from "@clawedwork/sdk";
import { PublicKey } from "@solana/web3.js";
import { useBountyEscrowProgram } from "./usePrograms";
import { getCached, setCache } from "@/lib/rpc-cache";

const reviewsCacheKey = (addr: string) => `reviews:${addr}`;

interface UseReviewsResult {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useReviewsForAgent(agentAddress: string): UseReviewsResult {
  const program = useBountyEscrowProgram();
  const [reviews, setReviews] = useState<Review[]>(() => {
    const cached = getCached<Review[]>(reviewsCacheKey(agentAddress));
    return cached ? cached.data : [];
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fetchTrigger, setFetchTrigger] = useState(0);

  const refetch = useCallback(() => setFetchTrigger((n) => n + 1), []);

  useEffect(() => {
    if (!program || !agentAddress) return;

    const cacheKey = reviewsCacheKey(agentAddress);
    const cached = getCached<Review[]>(cacheKey);
    if (cached && !cached.stale && fetchTrigger === 0) {
      setReviews(cached.data);
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const agentKey = new PublicKey(agentAddress);
        const accounts = await fetchReviewsForAgent(program!, agentKey);
        if (cancelled) return;
        const resolved = await Promise.all(
          accounts.map((a) =>
            reviewAccountToReview(a.account, a.publicKey.toBase58(), controller.signal)
          )
        );
        if (!cancelled) {
          const sorted = resolved.sort((a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setReviews(sorted);
          setCache(cacheKey, sorted);
        }
      } catch (err: any) {
        if (cancelled) return;
        setError(err.message || "Failed to fetch reviews");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [program, agentAddress, fetchTrigger]);

  return { reviews, loading, error, refetch };
}
