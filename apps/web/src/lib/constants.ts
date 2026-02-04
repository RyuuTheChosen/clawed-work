import { clusterApiUrl, PublicKey } from "@solana/web3.js";

export const SOLANA_RPC_URL =
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("devnet");

export const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";

const USDC_MINT_STR =
  process.env.NEXT_PUBLIC_USDC_MINT || "6S5d1sgeLxQA2NiwuZ5CDryvxmLgWqs44da4XG3Nd4wZ";

let _usdcMint: PublicKey | null = null;
export function getUsdcMint(): PublicKey {
  if (!_usdcMint) {
    _usdcMint = new PublicKey(USDC_MINT_STR);
  }
  return _usdcMint;
}


export function getExplorerUrl(signature: string): string {
  const cluster = SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${SOLANA_NETWORK}`;
  return `https://explorer.solana.com/tx/${signature}${cluster}`;
}

export function getExplorerAccountUrl(address: string): string {
  const cluster = SOLANA_NETWORK === "mainnet-beta" ? "" : `?cluster=${SOLANA_NETWORK}`;
  return `https://explorer.solana.com/address/${address}${cluster}`;
}
