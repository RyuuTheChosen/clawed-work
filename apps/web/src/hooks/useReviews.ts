"use client";

import { useState, useEffect, useCallback } from "react";
import type { Review } from "@clawwork/sdk";
import {
  fetchReviewsForAgent,
  reviewAccountToReview,
} from "@clawwork/sdk";
import { PublicKey } from "@solana/web3.js";
import { useBountyEscrowProgram } from "./usePrograms";

interface UseReviewsResult {
  reviews: Review[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useReviewsForAgent(agentAddress: string): UseReviewsResult {
  const program = useBountyEscrowProgram();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    if (!program || !agentAddress) return;
    setLoading(true);
    setError(null);
    try {
      const agentKey = new PublicKey(agentAddress);
      const accounts = await fetchReviewsForAgent(program, agentKey);
      const resolved = await Promise.all(
        accounts.map((a) =>
          reviewAccountToReview(a.account, a.publicKey.toBase58())
        )
      );
      setReviews(resolved.sort((a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      ));
    } catch (err: any) {
      setError(err.message || "Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  }, [program, agentAddress]);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { reviews, loading, error, refetch };
}
