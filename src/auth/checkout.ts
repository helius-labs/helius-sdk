import type {
  CheckoutInitializeRequest,
  CheckoutInitializeResponse,
  CheckoutStatusResponse,
  CheckoutPreviewResponse,
  CheckoutResult,
  CheckoutRequest,
} from "./types";
import { authRequest, sleep } from "./utils";
import { listProjects } from "./listProjects";
import { getProject } from "./getProject";
import {
  CHECKOUT_POLL_INTERVAL_MS,
  CHECKOUT_POLL_TIMEOUT_MS,
  PROJECT_POLL_INTERVAL_MS,
  PROJECT_POLL_TIMEOUT_MS,
  PLAN_TO_USAGE_PLAN,
} from "./constants";
import { fetchStripePriceIds } from "./devPortalConfigs";
import { payPaymentIntent } from "./payPaymentIntent";

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
  const params = new URLSearchParams({ priceId, refId });
  if (couponCode) params.set("couponCode", couponCode);
  return authRequest<CheckoutPreviewResponse>(
    `/checkout/preview?${params.toString()}`,
    {
      method: "GET",
      headers: { Authorization: `Bearer ${jwt}` },
    },
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

export async function getPaymentStatus(
  jwt: string,
  paymentIntentId: string,
  userAgent?: string
): Promise<CheckoutStatusResponse> {
  return authRequest<CheckoutStatusResponse>(
    `/checkout/${paymentIntentId}/status`,
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
  const timeoutMs = options?.timeoutMs ?? CHECKOUT_POLL_TIMEOUT_MS;
  const intervalMs = options?.intervalMs ?? CHECKOUT_POLL_INTERVAL_MS;
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    let status: CheckoutStatusResponse;
    try {
      status = await authRequest<CheckoutStatusResponse>(
        `/checkout/${paymentIntentId}/status`,
        {
          method: "GET",
          headers: { Authorization: `Bearer ${jwt}` },
        },
        userAgent
      );
    } catch (error) {
      // HTTP 410 Gone — intent expired
      if (error instanceof Error && error.message.includes("410")) {
        return {
          status: "expired",
          phase: "expired",
          subscriptionActive: false,
          readyToRedirect: false,
          message: "Payment intent expired",
        };
      }
      throw error;
    }

    if (status.readyToRedirect) {
      return status;
    }

    if (status.phase === "failed" || status.phase === "expired") {
      return status;
    }

    await sleep(intervalMs);
  }

  return {
    status: "pending",
    phase: "confirming",
    subscriptionActive: false,
    readyToRedirect: false,
    message: "Polling timed out",
  };
}

async function toCheckoutResult(
  jwt: string,
  intentId: string,
  txSig: string | null,
  userAgent?: string
): Promise<CheckoutResult> {
  const s = await pollCheckoutCompletion(jwt, intentId, userAgent);
  if (s.phase === "failed" || s.phase === "expired")
    return {
      paymentIntentId: intentId,
      txSignature: txSig,
      status: s.phase,
      error: s.message,
    };
  if (!s.readyToRedirect)
    return { paymentIntentId: intentId, txSignature: txSig, status: "timeout" };
  return { paymentIntentId: intentId, txSignature: txSig, status: "completed" };
}

export { payPaymentIntent } from "./payPaymentIntent";

export async function executeCheckout(
  secretKey: Uint8Array,
  jwt: string,
  request: CheckoutRequest,
  userAgent?: string,
  options?: { skipProjectPolling?: boolean }
): Promise<CheckoutResult> {
  const paymentMode = request.paymentMode;

  // 1. Resolve priceId from plan+period, then initialize checkout
  const priceId = await resolvePriceId(
    jwt,
    request.plan,
    request.period,
    userAgent
  );
  const intent = await initializeCheckout(
    jwt,
    {
      priceId,
      refId: request.refId,
      email: request.email,
      firstName: request.firstName,
      lastName: request.lastName,
      walletAddress: request.walletAddress,
      couponCode: request.couponCode,
      paymentMode,
      // walletAddress identifies the payer; signupWalletAddress tells the
      // backend to create/associate a Helius account during sponsored signup.
      signupWalletAddress:
        paymentMode === "sponsored" ? request.walletAddress : undefined,
    },
    userAgent
  );

  // 2. Send payment — pass jwt for sponsored intents; upgrades skip sponsorship.
  let txSignature: string | null = null;
  try {
    txSignature =
      (await payPaymentIntent(
        secretKey,
        intent,
        paymentMode === "sponsored" ? jwt : undefined,
        userAgent
      )) || null;
  } catch (error) {
    return {
      paymentIntentId: intent.id,
      txSignature: null,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // 3. Poll for payment confirmation
  const result = await toCheckoutResult(jwt, intent.id, txSignature, userAgent);

  // 4. Optionally poll for project creation
  if (result.status === "completed" && !options?.skipProjectPolling) {
    const projectDeadline = Date.now() + PROJECT_POLL_TIMEOUT_MS;

    while (Date.now() < projectDeadline) {
      const projects = await listProjects(jwt, userAgent);
      if (projects.length > 0) {
        result.projectId = projects[0].id;
        const details = await getProject(jwt, result.projectId, userAgent);
        result.apiKey = details.apiKeys?.[0]?.keyId;
        break;
      }
      await sleep(PROJECT_POLL_INTERVAL_MS);
    }
  }

  return result;
}

/** Execute a plan upgrade via OpenPay checkout.
 * @param customerInfo - Optional contact info (email, firstName, lastName); if any field is given, all three should be present. */
export async function executeUpgrade(
  secretKey: Uint8Array,
  jwt: string,
  plan: string,
  period: "monthly" | "yearly",
  projectId: string,
  couponCode?: string,
  userAgent?: string,
  customerInfo?: { email?: string; firstName?: string; lastName?: string }
): Promise<CheckoutResult> {
  const priceId = await resolvePriceId(jwt, plan, period, userAgent);
  const intent = await initializeCheckout(
    jwt,
    {
      priceId,
      refId: projectId,
      couponCode,
      email: customerInfo?.email,
      firstName: customerInfo?.firstName,
      lastName: customerInfo?.lastName,
    },
    userAgent
  );

  let txSignature: string | null = null;
  try {
    txSignature = (await payPaymentIntent(secretKey, intent)) || null;
  } catch (error) {
    return {
      paymentIntentId: intent.id,
      txSignature: null,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return toCheckoutResult(jwt, intent.id, txSignature, userAgent);
}

export async function executeRenewal(
  secretKey: Uint8Array,
  jwt: string,
  paymentIntentId: string,
  userAgent?: string
): Promise<CheckoutResult> {
  const intent = await getPaymentIntent(jwt, paymentIntentId, userAgent);

  if (intent.status !== "pending") {
    throw new Error(
      `Payment intent is ${intent.status}, cannot pay. Only pending intents can be paid.`
    );
  }

  let txSignature: string | null = null;
  try {
    txSignature = (await payPaymentIntent(secretKey, intent)) || null;
  } catch (error) {
    return {
      paymentIntentId: intent.id,
      txSignature: null,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  return toCheckoutResult(jwt, intent.id, txSignature, userAgent);
}
