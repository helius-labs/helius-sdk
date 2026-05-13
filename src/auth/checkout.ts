import type {
  CheckoutInitializeRequest,
  CheckoutInitializeResponse,
  CheckoutStatusResponse,
  CheckoutPreviewResponse,
} from "./types";
import { authRequest } from "./utils";
import { PLAN_TO_USAGE_PLAN } from "./constants";
import { fetchStripePriceIds } from "./devPortalConfigs";
import { pollUntilTerminal } from "./pollPayment";

export async function resolvePriceId(
  jwt: string,
  plan: string,
  period: "monthly" | "yearly",
  userAgent?: string
): Promise<string> {
  const planKey = plan.toLowerCase();
  const usagePlan = PLAN_TO_USAGE_PLAN[planKey];
  if (!usagePlan) {
    throw new Error(
      `Unknown plan: ${plan}. Available: ${Object.keys(PLAN_TO_USAGE_PLAN).join(", ")}`
    );
  }

  // Agent plan lives at a flat path (stripe.priceIds.AgentPlan) and is
  // only returned when the backend sees ?agent=cli. It has no period
  // concept (one-time invoice), so `period` is ignored here.
  if (planKey === "agent") {
    const priceIds = await fetchStripePriceIds(
      jwt,
      { includeAgentPlan: true },
      userAgent
    );
    const priceId = priceIds.AgentPlan;
    if (!priceId) {
      throw new Error(
        `No priceId found for plan "agent". The backend did not return ` +
          `stripe.priceIds.AgentPlan — likely the PRICE_ID_AGENT_PLAN ` +
          `secret is not configured in this environment.`
      );
    }
    return priceId;
  }

  const priceIds = await fetchStripePriceIds(jwt, undefined, userAgent);
  const periodKey = period === "monthly" ? "Monthly" : "Yearly";
  const priceId = priceIds[periodKey]?.[usagePlan];
  if (!priceId) {
    const available = Object.keys(priceIds[periodKey] ?? {});
    throw new Error(
      `No priceId found for plan "${plan}" (${period}). ` +
        (available.length === 0
          ? "The pricing configuration is empty — the backend may not be fully deployed yet."
          : `Expected key "${usagePlan}" but available keys are: [${available.join(", ")}]`)
    );
  }
  return priceId;
}

export async function initializeCheckout(
  jwt: string,
  request: CheckoutInitializeRequest,
  userAgent?: string
): Promise<CheckoutInitializeResponse> {
  return authRequest<CheckoutInitializeResponse>(
    "/checkout/initialize",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${jwt}` },
      body: JSON.stringify(request),
    },
    userAgent
  );
}

export async function getCheckoutPreview(
  jwt: string,
  plan: string,
  period: "monthly" | "yearly",
  refId: string,
  couponCode?: string,
  userAgent?: string
): Promise<CheckoutPreviewResponse> {
  const priceId = await resolvePriceId(jwt, plan, period, userAgent);
  return getCheckoutPreviewByPriceId(
    jwt,
    priceId,
    refId,
    couponCode,
    undefined,
    userAgent
  );
}

/**
 * Like {@link getCheckoutPreview} but takes a raw Stripe priceId directly.
 * Used by `createPayment` when callers pass a priceId rather than plan/period
 * (e.g. prepaid-credits SKUs, where the priceId lives on the project itself).
 */
export async function getCheckoutPreviewByPriceId(
  jwt: string,
  priceId: string,
  refId: string,
  couponCode?: string,
  qty?: number,
  userAgent?: string
): Promise<CheckoutPreviewResponse> {
  const params = new URLSearchParams({ priceId, refId });
  if (couponCode) params.set("couponCode", couponCode);
  if (qty !== undefined) params.set("qty", String(qty));
  return authRequest<CheckoutPreviewResponse>(
    `/checkout/preview?${params.toString()}`,
    { method: "GET", headers: { Authorization: `Bearer ${jwt}` } },
    userAgent
  );
}

export async function getPaymentIntent(
  jwt: string,
  paymentIntentId: string,
  userAgent?: string
): Promise<CheckoutInitializeResponse> {
  return authRequest<CheckoutInitializeResponse>(
    `/checkout/${paymentIntentId}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${jwt}` },
    },
    userAgent
  );
}

export async function pollCheckoutCompletion(
  jwt: string,
  paymentIntentId: string,
  userAgent?: string,
  options?: { timeoutMs?: number; intervalMs?: number }
): Promise<CheckoutStatusResponse> {
  const outcome = await pollUntilTerminal(jwt, paymentIntentId, {
    timeoutMs: options?.timeoutMs,
    intervalMs: options?.intervalMs,
    userAgent,
  });
  if (outcome.kind === "completed") return outcome.status;
  if (outcome.kind === "failed") return outcome.status;
  if (outcome.kind === "expired") {
    return (
      outcome.status ?? {
        status: "expired",
        phase: "expired",
        subscriptionActive: false,
        readyToRedirect: false,
        message: "Payment intent expired",
      }
    );
  }
  return {
    status: "pending",
    phase: "confirming",
    subscriptionActive: false,
    readyToRedirect: false,
    message: "Polling timed out",
  };
}
