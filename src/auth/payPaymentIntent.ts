import type { CheckoutInitializeResponse } from "./types";
import { loadKeypair } from "./loadKeypair";
import { getAddress } from "./getAddress";
import { checkSolBalance, checkUsdcBalance } from "./checkBalances";
import { payWithMemo } from "./payWithMemo";
import { paySponsoredIntent } from "./sponsoredPayment";
import { getHttpStatus } from "./getHttpStatus";
import { MIN_SOL_FOR_TX } from "./constants";

/**
 * Pay a checkout payment intent.
 * Sponsored first (when jwt provided), self-funded fallback.
 */
export async function payPaymentIntent(
  secretKey: Uint8Array,
  intent: CheckoutInitializeResponse,
  jwt?: string,
  userAgent?: string
): Promise<string> {
  if (intent.amount === 0) return "";

  // Sponsored first, self-funded fallback
  if (jwt) {
    try {
      return await paySponsoredIntent(secretKey, intent, jwt, userAgent);
    } catch (error) {
      // USDC errors re-throw — self-funded fallback would fail identically
      if (error instanceof Error && error.message.includes("Insufficient USDC"))
        throw error;
      // 4xx errors are permanent — self-funding won't help
      const status = getHttpStatus(error);
      if (status !== undefined && status >= 400 && status < 500) throw error;
      // Sponsorship infra issue (5xx / network) — fall back to self-funded
      console.warn(
        `[helius-sdk] Sponsored payment failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  // Self-funded fallback
  const keypair = loadKeypair(secretKey);
  const walletAddress = await getAddress(keypair);
  const amountRaw = BigInt(intent.amount) * 10_000n;

  const solBalance = await checkSolBalance(walletAddress);
  if (solBalance < MIN_SOL_FOR_TX) {
    throw new Error(
      `Insufficient SOL for fees. Have: ${Number(solBalance) / 1e9}, need: ~0.001 SOL. Fund: ${walletAddress}`
    );
  }

  const usdcBalance = await checkUsdcBalance(walletAddress);
  if (usdcBalance < amountRaw) {
    throw new Error(
      `Insufficient USDC. Have: ${Number(usdcBalance) / 1e6} USDC, need: ${intent.amount / 100} USDC. Fund: ${walletAddress}`
    );
  }

  return payWithMemo(secretKey, intent.destinationWallet, amountRaw, intent.id);
}
