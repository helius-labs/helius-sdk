import {
  CHECKOUT_POLL_INTERVAL_MS,
  CHECKOUT_POLL_TIMEOUT_MS,
} from "./constants";
import { createPayment } from "./createPayment";
import { getPaymentStatus } from "./checkout";
import { payPaymentLink } from "./payPaymentLink";
import { sleep } from "./utils";
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
 * project's existing Stripe customer.
 */
export const upgradePlan = async (
  options: UpgradePlanOptions
): Promise<UpgradePlanResult> => {
  const paymentLink = await createPayment({
    jwt: options.jwt,
    refId: options.projectId,
    plan: options.plan,
    period: options.period,
    email: options.email,
    firstName: options.firstName,
    lastName: options.lastName,
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

  const deadline = Date.now() + CHECKOUT_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    let status;
    try {
      status = await getPaymentStatus(options.jwt, paymentLink.paymentIntentId);
    } catch (error) {
      if (error instanceof Error && error.message.includes("410")) {
        return {
          kind: "expired",
          paymentIntentId: paymentLink.paymentIntentId,
        };
      }
      throw error;
    }

    if (status.readyToRedirect) {
      return {
        kind: "completed",
        txSignature,
        paymentIntentId: paymentLink.paymentIntentId,
      };
    }
    if (status.phase === "expired") {
      return {
        kind: "expired",
        paymentIntentId: paymentLink.paymentIntentId,
      };
    }
    if (status.phase === "failed") {
      return {
        kind: "failed",
        paymentIntentId: paymentLink.paymentIntentId,
        reason: status.message,
      };
    }
    await sleep(CHECKOUT_POLL_INTERVAL_MS);
  }

  return {
    kind: "pending",
    paymentLink,
    txSignature,
  };
};
