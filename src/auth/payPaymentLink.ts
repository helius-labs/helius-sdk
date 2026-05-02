import { payWithMemo } from "./payWithMemo";
import type { PaymentLink } from "./types";

/**
 * USDC has 6 decimals; payment-intent amounts are in cents (2 decimals),
 * so cents × 10_000 yields raw token units.
 */
const CENTS_TO_USDC_RAW = 10_000n;

/**
 * Sends USDC to the payment intent's `destinationWallet` with the
 * `paymentIntentId` as the on-chain memo. The backend watches the
 * treasury for transfers carrying that memo and credits the intent.
 *
 * Does not poll — `signupAndPay` polls authenticated status itself, and
 * the CLI `--pay` resume path polls via `getPaymentStatus`.
 *
 * @example
 * const { txSignature } = await payPaymentLink(keypair.secretKey, paymentLink);
 */
export const payPaymentLink = async (
  secretKey: Uint8Array,
  paymentLink: PaymentLink
): Promise<{ txSignature: string }> => {
  const rawAmount = BigInt(paymentLink.amountCents) * CENTS_TO_USDC_RAW;
  const txSignature = await payWithMemo(
    secretKey,
    paymentLink.destinationWallet,
    rawAmount,
    paymentLink.paymentIntentId
  );
  return { txSignature };
};
