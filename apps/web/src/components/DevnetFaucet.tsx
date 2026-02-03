"use client";

import { useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import { Loader2, Droplets, Coins } from "lucide-react";
import { SOLANA_NETWORK } from "@/lib/constants";

export function DevnetFaucet() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();

  const [solLoading, setSolLoading] = useState(false);
  const [solMessage, setSolMessage] = useState<string | null>(null);
  const [usdcLoading, setUsdcLoading] = useState(false);
  const [usdcMessage, setUsdcMessage] = useState<string | null>(null);

  // Only show on devnet
  if (SOLANA_NETWORK !== "devnet" || !connected || !publicKey) return null;

  const requestAirdrop = async () => {
    setSolLoading(true);
    setSolMessage(null);
    try {
      const sig = await connection.requestAirdrop(publicKey, 2 * LAMPORTS_PER_SOL);
      await connection.confirmTransaction(sig, "confirmed");
      setSolMessage("2 SOL airdropped");
    } catch (err: any) {
      if (err?.message?.includes("airdrop")) {
        setSolMessage("Airdrop limit reached. Try again later.");
      } else {
        setSolMessage("Airdrop failed. Try again.");
      }
    } finally {
      setSolLoading(false);
    }
  };

  const requestUsdc = async () => {
    setUsdcLoading(true);
    setUsdcMessage(null);
    try {
      const res = await fetch("/api/faucet/usdc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wallet: publicKey.toBase58() }),
      });
      const data = await res.json();
      if (res.ok) {
        setUsdcMessage("1,000 USDC minted");
      } else {
        setUsdcMessage(data.error || "USDC faucet failed. Try again.");
      }
    } catch {
      setUsdcMessage("USDC faucet failed. Try again.");
    } finally {
      setUsdcLoading(false);
    }
  };

  return (
    <div className="card p-4 border-accent/20 bg-accent/5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Droplets className="w-4 h-4 text-accent" />
          <span className="text-sm font-medium">Devnet Faucet</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={requestAirdrop}
            disabled={solLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-sm font-medium hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            {solLoading && <Loader2 className="w-3 h-3 animate-spin" />}
            Get 2 SOL
          </button>
          <button
            onClick={requestUsdc}
            disabled={usdcLoading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-accent/20 text-accent text-sm font-medium hover:bg-accent/30 transition-colors disabled:opacity-50"
          >
            {usdcLoading ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Coins className="w-3 h-3" />
            )}
            Get 1,000 USDC
          </button>
        </div>
      </div>
      {(solMessage || usdcMessage) && (
        <div className="flex flex-col gap-1 mt-2">
          {solMessage && <p className="text-xs text-muted">{solMessage}</p>}
          {usdcMessage && <p className="text-xs text-muted">{usdcMessage}</p>}
        </div>
      )}
    </div>
  );
}
