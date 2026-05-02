import {
  resolvePriceId,
  initializeCheckout,
  getCheckoutPreview,
} from "./checkout";
import { buildPaymentUrl } from "./paymentUrl";
import type { PaymentLink, SupportedPlan } from "./types";

const planNameFor = (
  plan: SupportedPlan,
  period: "monthly" | "yearly" | undefined
): string => {
  if (plan === "agent") return "Agent Plan";
  const cap = plan.charAt(0).toUpperCase() + plan.slice(1);
  return `${cap} (${period === "yearly" ? "Yearly" : "Monthly"})`;
};

interface CreatePaymentRequest {
  jwt: string;
  refId: string;
  plan: SupportedPlan;
  period?: "monthly" | "yearly";
  email?: string;
  firstName?: string;
  lastName?: string;
  couponCode?: string;
  walletAddress: string;
  paymentHost?: string;
}

/**
 * Resolves priceId, runs `getCheckoutPreview` to detect zero-amount
 * checkouts (rejected in Phase 1), then creates a `payment_required`
 * `PaymentLink` via `/checkout/initialize` in self-funded mode.
 *
 * Best-effort zero-amount rejection: the preview endpoint requires an
 * existing Stripe customer for one-time invoices (Agent Plan), which a
 * fresh signup does not have — backend throws "Customer ID is required
 * for one time preview". That case is swallowed and we fall through to
 * `/checkout/initialize`, which will create the customer + intent and
 * surface its own error if the final amount really is zero. The check
 * still catches 100%-coupon paths on flows where a customer exists
 * (upgrades, re-checkouts).
 *
 * Phase 1 caveat: not exported from the package's public entry — used
 * only by `signup` internally. Phase 2 promotes it as the shared
 * primitive for upgrade / credits / renewal flows.
 */
export const createPayment = async (
  req: CreatePaymentRequest
): Promise<PaymentLink> => {
  const period = req.period ?? "monthly";
  const priceId = await resolvePriceId(req.jwt, req.plan, period);
  try {
    const preview = await getCheckoutPreview(
      req.jwt,
      req.plan,
      period,
      req.refId,
      req.couponCode
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
    // no customer yet). Fall through to initialize.
  }
  const intent = await initializeCheckout(req.jwt, {
    priceId,
    refId: req.refId,
    email: req.email,
    firstName: req.firstName,
    lastName: req.lastName,
    walletAddress: req.walletAddress,
    couponCode: req.couponCode,
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
    planName: planNameFor(req.plan, period),
  };
};
