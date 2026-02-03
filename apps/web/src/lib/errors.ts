/**
 * Parse Anchor, wallet, and network errors into user-friendly messages.
 */

const ANCHOR_ERROR_MAP: Record<number, string> = {
  // Agent Registry errors
  6000: "Metadata URI is too long (max 200 characters).",
  6001: "Hourly rate must be greater than 0.",
  6002: "Availability must be Available, Busy, or Offline.",
  6003: "Rating must be between 1 and 5 stars.",
  // Bounty Escrow errors (offset by program)
  6000: "Metadata URI is too long.",
  6001: "Budget must be greater than 0.",
  6002: "Deadline must be in the future.",
  6003: "This bounty is no longer open for claims.",
  6004: "Bounty is not in the claimed state.",
  6005: "Bounty is not in the delivered state.",
  6006: "Only the assigned agent can perform this action.",
  6007: "You are not authorized for this action.",
  6008: "Cannot dispute this bounty in its current state.",
  6009: "Rating must be between 1 and 5 stars.",
  6010: "Bounty must be completed before leaving a review.",
};

const WALLET_ERRORS: Record<string, string> = {
  WalletNotConnectedError: "Please connect your wallet first.",
  WalletSignTransactionError: "Transaction signing was cancelled.",
  WalletSendTransactionError: "Failed to send transaction. Please try again.",
  WalletConnectionError: "Could not connect to wallet. Make sure your wallet extension is installed.",
  WalletDisconnectedError: "Wallet disconnected. Please reconnect.",
  WalletTimeoutError: "Wallet connection timed out. Please try again.",
};

export function parseError(error: unknown): string {
  if (!error) return "An unknown error occurred.";

  const err = error as any;
  const message = err?.message || err?.toString() || "";

  // Anchor program errors
  if (err?.code !== undefined && typeof err.code === "number") {
    return ANCHOR_ERROR_MAP[err.code] || `Program error: ${message}`;
  }

  // Anchor error with error.error.errorCode
  if (err?.error?.errorCode?.code) {
    const code = err.error.errorCode.number;
    if (code && ANCHOR_ERROR_MAP[code]) {
      return ANCHOR_ERROR_MAP[code];
    }
    return err.error.errorMessage || message;
  }

  // Wallet adapter errors
  if (err?.name && WALLET_ERRORS[err.name]) {
    return WALLET_ERRORS[err.name];
  }

  // User rejection
  if (
    message.includes("User rejected") ||
    message.includes("user rejected") ||
    message.includes("Transaction cancelled")
  ) {
    return "Transaction was cancelled.";
  }

  // Insufficient funds
  if (
    message.includes("insufficient funds") ||
    message.includes("Insufficient") ||
    message.includes("0x1") // Token program insufficient funds
  ) {
    return "Insufficient funds. Make sure you have enough SOL for fees and USDC for the transaction.";
  }

  // Account already exists (duplicate registration)
  if (message.includes("already in use") || message.includes("0x0")) {
    return "This account already exists. You may have already registered.";
  }

  // Network errors
  if (
    message.includes("Network request failed") ||
    message.includes("failed to fetch") ||
    message.includes("ECONNREFUSED")
  ) {
    return "Network error. Please check your connection and try again.";
  }

  // Transaction simulation failed
  if (message.includes("Simulation failed")) {
    return "Transaction simulation failed. The on-chain conditions may have changed.";
  }

  // Blockhash not found (expired)
  if (message.includes("Blockhash not found")) {
    return "Transaction expired. Please try again.";
  }

  // Generic fallback — truncate long messages
  if (message.length > 120) {
    return message.slice(0, 117) + "...";
  }

  return message || "An unexpected error occurred. Please try again.";
}
