import { TREASURY, USDC_MINT, PAYMENT_AMOUNT } from "./constants";
import { buildAndSendTokenTransfer } from "./buildTokenTransfer";

/**
 * Legacy 1 USDC unlock-fee transfer for wallet-created projects.
 *
 * @deprecated Wallet-created projects are no longer supported by the backend. Use `signup` / `signupAndPay` (requires `email`, `firstName`, `lastName`).
 */
export async function payUSDC(secretKey: Uint8Array): Promise<string> {
  return buildAndSendTokenTransfer({
    secretKey,
    recipientAddress: TREASURY,
    mintAddress: USDC_MINT,
    amount: PAYMENT_AMOUNT,
  });
}
