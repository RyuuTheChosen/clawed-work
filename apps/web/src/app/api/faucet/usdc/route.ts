import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  clusterApiUrl,
} from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  mintTo,
} from "@solana/spl-token";

const SOLANA_NETWORK = process.env.NEXT_PUBLIC_SOLANA_NETWORK || "devnet";
const RPC_URL =
  process.env.SOLANA_RPC_URL || process.env.NEXT_PUBLIC_SOLANA_RPC_URL || clusterApiUrl("devnet");
const USDC_MINT_STR =
  process.env.NEXT_PUBLIC_USDC_MINT || "6S5d1sgeLxQA2NiwuZ5CDryvxmLgWqs44da4XG3Nd4wZ";

let _usdcMint: PublicKey | null = null;
function getUsdcMint(): PublicKey {
  if (!_usdcMint) {
    _usdcMint = new PublicKey(USDC_MINT_STR);
  }
  return _usdcMint;
}

// 1,000 USDC = 1_000_000_000 minor units (6 decimals)
const MINT_AMOUNT = 1_000_000_000;

// Singleton connection — reuse across requests
let _connection: Connection | null = null;
function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(RPC_URL, "confirmed");
  }
  return _connection;
}

// ---------------------------------------------------------------------------
// Rate limiting — Upstash Redis when configured, in-memory fallback for local
// ---------------------------------------------------------------------------

const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
const useUpstash = Boolean(UPSTASH_URL && UPSTASH_TOKEN);

// Lazy-init so we don't import Upstash in local dev
let _walletLimiter: any = null;
let _globalLimiter: any = null;

async function getUpstashLimiters() {
  if (!_walletLimiter) {
    const { Redis } = await import("@upstash/redis");
    const { Ratelimit } = await import("@upstash/ratelimit");
    const redis = new Redis({ url: UPSTASH_URL!, token: UPSTASH_TOKEN! });

    // Per-wallet: 1 request per 30s
    _walletLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(1, "30s"),
      prefix: "faucet:wallet",
    });

    // Global: 10 requests per 60s
    _globalLimiter = new Ratelimit({
      redis,
      limiter: Ratelimit.fixedWindow(10, "60s"),
      prefix: "faucet:global",
    });
  }
  return { walletLimiter: _walletLimiter, globalLimiter: _globalLimiter };
}

// In-memory fallback for local dev
const cooldowns = new Map<string, number>();
const COOLDOWN_MS = 30_000;
const GLOBAL_WINDOW_MS = 60_000;
const GLOBAL_MAX_REQUESTS = 10;
let globalRequestTimes: number[] = [];

async function checkRateLimit(wallet: string): Promise<{ limited: boolean; message: string }> {
  if (useUpstash) {
    const { walletLimiter, globalLimiter } = await getUpstashLimiters();

    const globalResult = await globalLimiter.limit("global");
    if (!globalResult.success) {
      return { limited: true, message: "Faucet is busy — try again in a minute" };
    }

    const walletResult = await walletLimiter.limit(wallet);
    if (!walletResult.success) {
      const wait = Math.ceil((walletResult.reset - Date.now()) / 1000);
      return { limited: true, message: `Rate limited — try again in ${wait}s` };
    }

    return { limited: false, message: "" };
  }

  // In-memory fallback
  const now = Date.now();
  globalRequestTimes = globalRequestTimes.filter((t) => now - t < GLOBAL_WINDOW_MS);
  if (globalRequestTimes.length >= GLOBAL_MAX_REQUESTS) {
    return { limited: true, message: "Faucet is busy — try again in a minute" };
  }

  const lastRequest = cooldowns.get(wallet);
  if (lastRequest && now - lastRequest < COOLDOWN_MS) {
    const wait = Math.ceil((COOLDOWN_MS - (now - lastRequest)) / 1000);
    return { limited: true, message: `Rate limited — try again in ${wait}s` };
  }

  globalRequestTimes.push(now);
  cooldowns.set(wallet, now);
  return { limited: false, message: "" };
}

function clearCooldownOnError(wallet: string) {
  if (!useUpstash) {
    cooldowns.delete(wallet);
  }
}

// ---------------------------------------------------------------------------

function getMintAuthority(): Keypair | null {
  const raw = process.env.FAUCET_MINT_AUTHORITY;
  if (!raw) return null;
  try {
    const bs58 = require("bs58") as { decode: (s: string) => Uint8Array };
    return Keypair.fromSecretKey(bs58.decode(raw));
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  // Guard: devnet only
  if (SOLANA_NETWORK !== "devnet") {
    return NextResponse.json(
      { error: "Faucet is only available on devnet" },
      { status: 403 }
    );
  }

  // Guard: mint authority configured
  const mintAuthority = getMintAuthority();
  if (!mintAuthority) {
    return NextResponse.json(
      { error: "Faucet not configured — mint authority missing" },
      { status: 503 }
    );
  }

  // Parse body
  let wallet: string;
  try {
    const body = await req.json();
    wallet = body.wallet;
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  // Validate pubkey
  let recipient: PublicKey;
  try {
    recipient = new PublicKey(wallet);
    if (!PublicKey.isOnCurve(recipient)) throw new Error();
  } catch {
    return NextResponse.json(
      { error: "Invalid wallet address" },
      { status: 400 }
    );
  }

  // Rate limit
  const rateCheck = await checkRateLimit(wallet);
  if (rateCheck.limited) {
    return NextResponse.json(
      { error: rateCheck.message },
      { status: 429 }
    );
  }

  // Mint USDC
  try {
    const connection = getConnection();

    const usdcMint = getUsdcMint();

    const tokenAccount = await getOrCreateAssociatedTokenAccount(
      connection,
      mintAuthority,
      usdcMint,
      recipient
    );

    const signature = await mintTo(
      connection,
      mintAuthority,
      usdcMint,
      tokenAccount.address,
      mintAuthority,
      MINT_AMOUNT
    );

    return NextResponse.json({ success: true, signature });
  } catch (err: any) {
    console.error("USDC faucet error:", err);
    clearCooldownOnError(wallet);
    return NextResponse.json(
      { error: "Mint failed — " + (err?.message || "unknown error") },
      { status: 500 }
    );
  }
}
