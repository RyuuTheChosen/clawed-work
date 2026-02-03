import { clusterApiUrl, PublicKey } from "@solana/web3.js";

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("devnet");

export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";

export const USDC_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_USDC_MINT || "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU"
);

export function getExplorerUrl(signature: string): string {
  const cluster = SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${SOLANA_NETWORK}`;
  return `https://explorer.solana.com/tx/${signature}${cluster}`;
}

export function getExplorerAccountUrl(address: string): string {
  const cluster = SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${SOLANA_NETWORK}`;
  return `https://explorer.solana.com/address/${address}${cluster}`;
}
