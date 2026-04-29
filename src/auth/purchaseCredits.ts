import type { PurchaseCreditsOptions, PurchaseCreditsResult } from "./types";
import { getAddress } from "./getAddress";
import { loadKeypair } from "./loadKeypair";
import { listProjects } from "./listProjects";
import { getProject } from "./getProject";
import {
  initializeCheckout,
  pollCheckoutCompletion,
  payPaymentIntent,
} from "./checkout";

const AGENT_PLAN_ID = "agent_v4";

/**
 * Buy additional prepaid credits for an agent-plan project.
 *
 * Agent-only in this release: the SDK pre-flights the target project's
 * plan before calling `/checkout/initialize`, because `payPaymentIntent`
 * re-throws 4xx sponsor failures (see `payPaymentIntent.ts:22-38`) and
 * a non-agent sponsored top-up would be rejected by the backend with a
 * 400 — the pre-flight surfaces a clean client-side error instead of
 * a raw backend rejection.
 *
 * Each unit of `qty` grants 1,000,000 credits (backend constant
 * `PREPAID_CREDITS_PER_UNIT_QTY`).
 */
export async function purchaseCredits(
  secretKey: Uint8Array,
  jwt: string,
  options: PurchaseCreditsOptions,
  userAgent?: string
): Promise<PurchaseCreditsResult> {
  const qty = options.qty ?? 1;
  if (!Number.isInteger(qty) || qty < 1) {
    throw new Error(
      `purchaseCredits: \`qty\` must be a positive integer, received ${qty}.`
    );
  }

  // 1. Pre-flight: confirm the project is on agent_v4.
  const projects = await listProjects(jwt, userAgent);
  const project = projects.find((p) => p.id === options.projectId);
  if (!project) {
    throw new Error(
      `Project ${options.projectId} not found for this authenticated user.`
    );
  }
  const currentPlan = project.subscription?.plan;
  if (currentPlan !== AGENT_PLAN_ID) {
    throw new Error(
      `purchaseCredits is only supported for agent-plan projects in this ` +
        `SDK version; project ${options.projectId} is on "${currentPlan ?? "unknown"}". ` +
        `Other plans must top up via the dashboard.`
    );
  }

  // 2. Resolve the top-up priceId from the project's own details.
  // The backend derives this from planSpecifications.overageCost so it
  // tracks each plan's prepaid-credits SKU automatically (agent_v4 →
  // prepaid_credits_10_USDC). `tier` is unused in this SDK version.
  const projectDetails = await getProject(jwt, options.projectId, userAgent);
  const priceId = projectDetails.prepaidCreditsPriceId;
  if (!priceId) {
    throw new Error(
      `Project ${options.projectId} does not expose a prepaid-credits priceId. ` +
        `The backend may not have provisioned it yet — try again shortly, or ` +
        `top up via the dashboard.`
    );
  }

  // 3. Initialize a sponsored checkout for the top-up.
  const keypair = loadKeypair(secretKey);
  const payerWallet = await getAddress(keypair);
  const intent = await initializeCheckout(
    jwt,
    {
      priceId,
      refId: options.projectId,
      qty,
      paymentMode: "sponsored",
      signupWalletAddress: payerWallet,
      walletAddress: payerWallet,
      couponCode: options.couponCode,
    },
    userAgent
  );

  // 4. Pay — sponsored-first with infrastructure-only fallback.
  let txSignature: string | null = null;
  try {
    txSignature =
      (await payPaymentIntent(secretKey, intent, jwt, userAgent)) || null;
  } catch (error) {
    return {
      paymentIntentId: intent.id,
      txSignature: null,
      status: "failed",
      amountCents: intent.amount,
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // 5. Poll for backend confirmation.
  const status = await pollCheckoutCompletion(jwt, intent.id, userAgent);

  if (status.phase === "failed" || status.phase === "expired") {
    return {
      paymentIntentId: intent.id,
      txSignature,
      status: status.phase,
      amountCents: intent.amount,
      error: status.message,
    };
  }
  if (!status.readyToRedirect) {
    return {
      paymentIntentId: intent.id,
      txSignature,
      status: "timeout",
      amountCents: intent.amount,
    };
  }
  return {
    paymentIntentId: intent.id,
    txSignature,
    status: "completed",
    amountCents: intent.amount,
  };
}
