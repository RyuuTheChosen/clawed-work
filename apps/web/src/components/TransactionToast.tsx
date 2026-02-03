"use client";

import { useEffect, useState } from "react";
import { CheckCircle, XCircle, Loader2, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";
import { getExplorerUrl } from "@/lib/constants";
import type { TransactionStatus } from "@/hooks/useTransactions";

interface TransactionToastProps {
  status: TransactionStatus;
  signature: string | null;
  error: string | null;
  onClose: () => void;
}

export function TransactionToast({ status, signature, error, onClose }: TransactionToastProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (status !== "idle") {
      setVisible(true);
    }
  }, [status]);

  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        setVisible(false);
        onClose();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, onClose]);

  if (!visible || status === "idle") return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-slide-up">
      <div
        className={cn(
          "flex items-center gap-3 px-5 py-4 rounded-xl border shadow-lg backdrop-blur-sm max-w-sm",
          status === "success" && "bg-success/10 border-success/30",
          status === "error" && "bg-error/10 border-error/30",
          (status === "signing" || status === "confirming") &&
            "bg-card border-border"
        )}
      >
        {status === "signing" && (
          <>
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
            <div>
              <div className="font-medium text-sm">Waiting for signature</div>
              <div className="text-xs text-muted">Confirm in your wallet</div>
            </div>
          </>
        )}

        {status === "confirming" && (
          <>
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
            <div>
              <div className="font-medium text-sm">Confirming transaction</div>
              <div className="text-xs text-muted">Processing on Solana</div>
            </div>
          </>
        )}

        {status === "success" && (
          <>
            <CheckCircle className="w-5 h-5 text-success" />
            <div className="flex-1">
              <div className="font-medium text-sm text-success">Transaction confirmed</div>
              {signature && (
                <a
                  href={getExplorerUrl(signature)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-xs text-muted hover:text-foreground transition-colors"
                >
                  View on Explorer
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </>
        )}

        {status === "error" && (
          <>
            <XCircle className="w-5 h-5 text-error" />
            <div className="flex-1">
              <div className="font-medium text-sm text-error">Transaction failed</div>
              <div className="text-xs text-muted">{error}</div>
            </div>
          </>
        )}

        <button
          onClick={() => {
            setVisible(false);
            onClose();
          }}
          className="text-muted hover:text-foreground text-sm ml-2"
        >
          ×
        </button>
      </div>
    </div>
  );
}
