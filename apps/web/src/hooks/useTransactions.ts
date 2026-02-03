"use client";

import { useState, useCallback } from "react";
import { parseError } from "@/lib/errors";

export type TransactionStatus = "idle" | "signing" | "confirming" | "success" | "error";

interface UseTransactionResult {
  status: TransactionStatus;
  signature: string | null;
  error: string | null;
  execute: (fn: () => Promise<string>) => Promise<string | null>;
  reset: () => void;
}

export function useTransaction(): UseTransactionResult {
  const [status, setStatus] = useState<TransactionStatus>("idle");
  const [signature, setSignature] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const reset = useCallback(() => {
    setStatus("idle");
    setSignature(null);
    setError(null);
  }, []);

  const execute = useCallback(async (fn: () => Promise<string>): Promise<string | null> => {
    setStatus("signing");
    setSignature(null);
    setError(null);

    try {
      const sig = await fn();
      setSignature(sig);
      setStatus("confirming");

      // Transaction is already confirmed when rpc() returns with confirmed commitment
      setStatus("success");
      return sig;
    } catch (err: unknown) {
      setError(parseError(err));
      setStatus("error");
      return null;
    }
  }, []);

  return { status, signature, error, execute, reset };
}
