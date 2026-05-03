import {
  resolvePriceId,
  initializeCheckout,
  getCheckoutPreview,
  getCheckoutPreviewByPriceId,
} from "./checkout";
import { buildPaymentUrl } from "./paymentUrl";
import type { PaymentLink, SupportedPlan } from "./types";

const planNameFor = (
  plan: SupportedPlan | undefined,
  period: "monthly" | "yearly" | undefined,
  fallbackName?: string
): string => {
  if (!plan) return fallbackName ?? "Helius";
  if (plan === "agent") return "Agent Plan";
  const cap = plan.charAt(0).toUpperCase() + plan.slice(1);
  return `${cap} (${period === "yearly" ? "Yearly" : "Monthly"})`;
};

/**
 * Shared primitive for every paid flow (signup, upgrade, credits, renewal-link).
 *
 * Two ways to specify pricing:
 *  - `plan` + optional `period` — SDK resolves the priceId via
 *    `/dev-portal/configs` (`stripe.priceIds`).
 *  - `priceId` — caller supplies a Stripe price ID directly. Used by
 *    `purchaseCredits` (the SKU lives on the project's `prepaidCreditsPriceId`
 *    field) and by other flows where the plan/period helpers don't apply.
 *
 * The zero-amount check via `getCheckoutPreview` is best-effort. Preview needs
 * an existing Stripe customer for one-time invoices (Agent Plan, prepaid
 * credits) — fresh signups don't have one yet, and the backend throws
 * "Customer ID is required for one time preview". That case is swallowed and
 * the request falls through to `/checkout/initialize`, which surfaces its
 * own error if the final amount truly is zero. The check still catches
 * 100%-coupon paths on flows where a customer exists (upgrades, re-checkouts).
 */
export interface CreatePaymentRequest {
  jwt: string;
  refId: string;
  /** Provide either `priceId` OR `plan` (+ optional `period`). */
  priceId?: string;
  plan?: SupportedPlan;
  period?: "monthly" | "yearly";
  /** Quantity multiplier for one-time SKUs (e.g. prepaid credits). Defaults to 1. */
  qty?: number;
  email?: string;
  firstName?: string;
  lastName?: string;
  couponCode?: string;
  walletAddress?: string;
  paymentHost?: string;
  /** Override the display label used for `paymentLink.planName`. */
  planNameOverride?: string;
}

export const createPayment = async (
  req: CreatePaymentRequest
): Promise<PaymentLink> => {
  if (!req.priceId && !req.plan) {
    throw new Error("createPayment: must provide either `priceId` or `plan`.");
  }

  const period = req.period ?? "monthly";
  const priceId =
    req.priceId ?? (await resolvePriceId(req.jwt, req.plan!, period));

  // Best-effort zero-amount rejection — preview is plan-keyed in the
  // `plan`/`period` case and priceId-keyed in the raw-priceId case.
  try {
    const preview = req.plan
      ? await getCheckoutPreview(
          req.jwt,
          req.plan,
          period,
          req.refId,
          req.couponCode
        )
      : await getCheckoutPreviewByPriceId(
          req.jwt,
          priceId,
          req.refId,
          req.couponCode,
          req.qty
        );
    if (preview.dueToday === 0) {
      throw new Error(
        "Zero-amount signups are not supported in this version. " +
          "Remove the coupon or use a different plan."
      );
    }
  } catch (error) {
    if (
      error instanceof Error &&
      error.message.startsWith("Zero-amount signups")
    ) {
      throw error;
    }
    // Preview unreachable for this caller (typically fresh signup with
    // no Stripe customer yet — backend throws "Customer ID is required for
    // one time preview"). Fall through to initialize.
  }

  const intent = await initializeCheckout(req.jwt, {
    priceId,
    refId: req.refId,
    email: req.email,
    firstName: req.firstName,
    lastName: req.lastName,
    walletAddress: req.walletAddress,
    couponCode: req.couponCode,
    qty: req.qty,
    paymentMode: "self_funded",
  });
  return {
    kind: "payment_required",
    paymentIntentId: intent.id,
    amountCents: intent.amount,
    destinationWallet: intent.destinationWallet,
    memo: intent.id,
    expiresAt: intent.expiresAt,
    paymentUrl: buildPaymentUrl(intent.id, req.paymentHost),
    solanaPayUrl: intent.solanaPayUrl,
    planName: planNameFor(req.plan, period, req.planNameOverride),
  };
};
