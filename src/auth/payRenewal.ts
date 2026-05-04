import { getPaymentIntent } from "./checkout";
import { payPaymentLink } from "./payPaymentLink";
import { buildPaymentUrl } from "./paymentUrl";
import { pollUntilTerminal } from "./pollPayment";
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

  const outcome = await pollUntilTerminal(jwt, paymentIntentId);
  if (outcome.kind === "completed") {
    return { kind: "completed", txSignature, paymentIntentId };
  }
  if (outcome.kind === "expired") {
    return { kind: "expired", paymentIntentId };
  }
  if (outcome.kind === "failed") {
    return { kind: "failed", paymentIntentId, reason: outcome.status.message };
  }
  return { kind: "pending", paymentLink, txSignature };
};
