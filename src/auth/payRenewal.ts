import {
  CHECKOUT_POLL_INTERVAL_MS,
  CHECKOUT_POLL_TIMEOUT_MS,
} from "./constants";
import { getPaymentIntent, getPaymentStatus } from "./checkout";
import { payPaymentLink } from "./payPaymentLink";
import { buildPaymentUrl } from "./paymentUrl";
import { sleep } from "./utils";
import type { PayRenewalAndPayResult, PayRenewalResult } from "./types";

/**
 * Phase 2 — wrap an existing renewal payment intent as a {@link PaymentLink}.
 * Used by `helius pay <paymentIntentId>` to surface a hosted-checkout link
 * for a renewal invoice.
 *
 * No new intent is created; this just fetches the existing one and builds
 * the public-pay URL.
 */
export const payRenewal = async (
  jwt: string,
  paymentIntentId: string,
  options: { paymentHost?: string } = {}
): Promise<PayRenewalResult> => {
  const intent = await getPaymentIntent(jwt, paymentIntentId);
  if (intent.status !== "pending") {
    throw new Error(
      `Payment intent ${paymentIntentId} is ${intent.status}; only pending intents can be paid.`
    );
  }
  return {
    kind: "payment_required",
    paymentLink: {
      kind: "payment_required",
      paymentIntentId: intent.id,
      amountCents: intent.amount,
      destinationWallet: intent.destinationWallet,
      memo: intent.id,
      expiresAt: intent.expiresAt,
      paymentUrl: buildPaymentUrl(intent.id, options.paymentHost),
      solanaPayUrl: intent.solanaPayUrl,
      planName: "Subscription renewal",
    },
  };
};

/**
 * `payRenewal` + auto-pay USDC + memo, polling authenticated status.
 * Renewals don't have a webhook-driven activation gate (the subscription is
 * already active), so `readyToRedirect` flips on payment confirmation alone.
 */
export const payRenewalAndPay = async (
  secretKey: Uint8Array,
  jwt: string,
  paymentIntentId: string,
  options: { paymentHost?: string } = {}
): Promise<PayRenewalAndPayResult> => {
  const result = await payRenewal(jwt, paymentIntentId, options);
  const { paymentLink } = result;
  const { txSignature } = await payPaymentLink(secretKey, paymentLink);

  const deadline = Date.now() + CHECKOUT_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    let status;
    try {
      status = await getPaymentStatus(jwt, paymentIntentId);
    } catch (error) {
      if (error instanceof Error && error.message.includes("410")) {
        return { kind: "expired", paymentIntentId };
      }
      throw error;
    }
    if (status.readyToRedirect) {
      return { kind: "completed", txSignature, paymentIntentId };
    }
    if (status.phase === "expired") {
      return { kind: "expired", paymentIntentId };
    }
    if (status.phase === "failed") {
      return {
        kind: "failed",
        paymentIntentId,
        reason: status.message,
      };
    }
    await sleep(CHECKOUT_POLL_INTERVAL_MS);
  }

  return { kind: "pending", paymentLink, txSignature };
};
