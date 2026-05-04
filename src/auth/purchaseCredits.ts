import { createPayment } from "./createPayment";
import { payPaymentLink } from "./payPaymentLink";
import { listProjects } from "./listProjects";
import { getProject } from "./getProject";
import { pollUntilTerminal } from "./pollPayment";
import type {
  PurchaseCreditsAndPayOptions,
  PurchaseCreditsAndPayResult,
  PurchaseCreditsLinkOptions,
  PurchaseCreditsLinkResult,
} from "./types";

const AGENT_PLAN_ID = "agent_v4";

/**
 * Resolves the prepaid-credits priceId from the project's own details and
 * pre-flights the agent-plan constraint. Backend exposes `prepaidCreditsPriceId`
 * derived from `planSpecifications.overageCost`, so the SKU automatically
 * tracks each plan's credits SKU (today only `agent_v4` → `prepaid_credits_10_USDC`).
 */
const resolvePrepaidCreditsPriceId = async (
  jwt: string,
  projectId: string
): Promise<string> => {
  const projects = await listProjects(jwt);
  const project = projects.find((p) => p.id === projectId);
  if (!project) {
    throw new Error(
      `Project ${projectId} not found for this authenticated user.`
    );
  }
  const currentPlan = project.subscription?.plan;
  if (currentPlan !== AGENT_PLAN_ID) {
    // Prepaid credits are an Agent-plan-only product: $10 USDC per 1M credits,
    // one-time top-up. Subscription plans (developer/business/professional) get
    // monthly credit allotments and overage is auto-billed at $5 per 1M on the
    // next Stripe invoice — there's no manual top-up flow. The dashboard does
    // not expose a "buy credits" button for those plans either.
    throw new Error(
      `purchaseCredits is Agent-plan only ($10 USDC per 1M credits, one-time top-up). ` +
        `Project ${projectId} is on "${currentPlan ?? "unknown"}", where credit overage ` +
        `is auto-billed at $5 per 1M on the next invoice (no manual top-up). ` +
        `Use \`getAccountStatus\` (MCP) or the dashboard to inspect usage.`
    );
  }
  const details = await getProject(jwt, projectId);
  const priceId = details.prepaidCreditsPriceId;
  if (!priceId) {
    throw new Error(
      `Project ${projectId} does not expose a prepaid-credits priceId. ` +
        `The backend may not have provisioned it yet — try again shortly, or ` +
        `top up via the dashboard.`
    );
  }
  return priceId;
};

/**
 * Phase 2 — buy additional prepaid credits for an agent-plan project.
 *
 * Returns a hosted-checkout link only. To auto-pay from a local keypair,
 * use {@link purchaseCreditsAndPay}.
 *
 * Each unit of `qty` grants 1,000,000 credits (backend constant
 * `PREPAID_CREDITS_PER_UNIT_QTY`).
 */
export const purchaseCredits = async (
  options: PurchaseCreditsLinkOptions
): Promise<PurchaseCreditsLinkResult> => {
  const qty = options.qty ?? 1;
  if (!Number.isInteger(qty) || qty < 1) {
    throw new Error(
      `purchaseCredits: \`qty\` must be a positive integer, received ${qty}.`
    );
  }
  const priceId = await resolvePrepaidCreditsPriceId(
    options.jwt,
    options.projectId
  );
  const paymentLink = await createPayment({
    jwt: options.jwt,
    refId: options.projectId,
    priceId,
    qty,
    couponCode: options.couponCode,
    paymentHost: options.paymentHost,
    planNameOverride: `Prepaid credits (${qty} × 1M)`,
  });
  return { kind: "payment_required", paymentLink };
};

/**
 * `purchaseCredits` + auto-pay USDC + memo from the local keypair, then
 * poll authenticated status until activation. On poll timeout returns
 * `kind: "pending"` with `paymentLink` + `txSignature` for `--resume`.
 */
export const purchaseCreditsAndPay = async (
  options: PurchaseCreditsAndPayOptions
): Promise<PurchaseCreditsAndPayResult> => {
  const result = await purchaseCredits(options);
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
