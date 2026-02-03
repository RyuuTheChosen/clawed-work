"use client";

import { useState } from "react";
import { AlertTriangle, X } from "lucide-react";
import { SOLANA_NETWORK } from "@/lib/constants";

export function DevnetBanner() {
  const [dismissed, setDismissed] = useState(false);

  if (SOLANA_NETWORK !== "devnet" || dismissed) return null;

  return (
    <div className="bg-warning/10 border-b border-warning/20 px-4 py-2">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-warning text-sm">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Devnet — tokens have no real value</span>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-warning/60 hover:text-warning transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
