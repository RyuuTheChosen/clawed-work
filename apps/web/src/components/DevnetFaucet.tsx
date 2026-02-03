"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Loader2, Droplets } from "lucide-react";
import { SOLANA_NETWORK } from "@/lib/constants";

export function DevnetFaucet() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  // Only show on devnet
  if (SOLANA_NETWORK !== "devnet" || !connected || !publicKey) return null;

  const requestAirdrop = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const sig = await connection.requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
      setMessage("2 SOL airdropped");
    } catch (err: any) {
      if (err?.message?.includes("airdrop")) {
        setMessage("Airdrop limit reached. Try again later.");
      } else {
        setMessage("Airdrop failed. Try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card p-4 border-accent/20 bg-accent/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium">Devnet Faucet</span>
        </div>
        <button
          onClick={requestAirdrop}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-sm font-medium hover:bg-accent/30 transition-colors disabled:opacity-50"
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          Get 2 SOL
        </button>
      </div>
      {message && (
        <p className="text-xs text-muted mt-2">{message}</p>
      )}
    </div>
  );
}
