import { requireContactInfo } from "./signupHelpers";
import { createPayment } from "./createPayment";
import { payPaymentLink } from "./payPaymentLink";
import { pollUntilTerminal } from "./pollPayment";
import type {
  UpgradePlanAndPayOptions,
  UpgradePlanAndPayResult,
  UpgradePlanOptions,
  UpgradePlanResult,
} from "./types";

/**
 * Phase 2 — create a payment intent for upgrading an existing project to a
 * new plan, and return a hosted-checkout link the user can open in a
 * browser. Contact info is optional; the backend auto-fetches it from the
 * project's existing Stripe customer. If any of `email` / `firstName` /
 * `lastName` is passed, all three are required and validated like `signup`.
 */
export const upgradePlan = async (
  options: UpgradePlanOptions
): Promise<UpgradePlanResult> => {
  const contactProvided =
    options.email !== undefined ||
    options.firstName !== undefined ||
    options.lastName !== undefined;
  const contact = contactProvided
    ? requireContactInfo(options, "Upgrade")
    : undefined;
  const paymentLink = await createPayment({
    jwt: options.jwt,
    refId: options.projectId,
    plan: options.plan,
    period: options.period,
    email: contact?.email,
    firstName: contact?.firstName,
    lastName: contact?.lastName,
    couponCode: options.couponCode,
    paymentHost: options.paymentHost,
  });
  return { kind: "payment_required", paymentLink };
};

/**
 * `upgradePlan` + auto-pay USDC + memo from the local keypair, then poll
 * authenticated `getPaymentStatus` until activation, returning the result
 * shape ({@link UpgradePlanAndPayResult}). On poll timeout returns
 * `kind: "pending"` with `paymentLink` + `txSignature` for `--resume`.
 */
export const upgradePlanAndPay = async (
  options: UpgradePlanAndPayOptions
): Promise<UpgradePlanAndPayResult> => {
  const result = await upgradePlan(options);
  const { paymentLink } = result;
  const { txSignature } = await payPaymentLink(options.secretKey, paymentLink);
  const paymentIntentId = paymentLink.paymentIntentId;

  const outcome = await pollUntilTerminal(options.jwt, paymentIntentId);
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
