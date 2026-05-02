import { PLAN_TO_USAGE_PLAN } from "./constants";
import { loadKeypair } from "./loadKeypair";
import { getAddress } from "./getAddress";
import { signAuthMessage } from "./signAuthMessage";
import { walletSignup } from "./walletSignup";
import { listProjects } from "./listProjects";
import { getProject } from "./getProject";
import { createApiKey } from "./createApiKey";
import {
  resolvePriceId,
  initializeCheckout,
  getCheckoutPreview,
} from "./checkout";
import { buildEndpoints } from "./signupHelpers";
import { buildPaymentUrl } from "./paymentUrl";
import type {
  Endpoints,
  PaymentLink,
  PreauthenticatedSignupOptions,
  ProjectListItem,
  SecretKeySignupOptions,
  SignupOptions,
  SignupResult,
  SupportedPlan,
} from "./types";

const SUPPORTED_PLANS: readonly SupportedPlan[] = [
  "agent",
  "developer",
  "business",
  "professional",
];

const validatePlan = (plan: string): SupportedPlan => {
  const normalized = plan.toLowerCase() as SupportedPlan;
  if (!SUPPORTED_PLANS.includes(normalized)) {
    throw new Error(
      `Unknown plan: ${plan}. Available: ${SUPPORTED_PLANS.join(", ")}`
    );
  }
  return normalized;
};

const planNameFor = (
  plan: SupportedPlan,
  period: "monthly" | "yearly" | undefined
): string => {
  if (plan === "agent") return "Agent Plan";
  const cap = plan.charAt(0).toUpperCase() + plan.slice(1);
  return `${cap} (${period === "yearly" ? "Yearly" : "Monthly"})`;
};

/**
 * Conservative same-plan match. For `agent`, period is ignored. Subscription
 * plans require both family AND period to match confidently — otherwise treat
 * as upgrade to avoid wrongly claiming "already on this plan".
 */
const matchesExistingPlan = (
  project: ProjectListItem,
  plan: SupportedPlan,
  period: "monthly" | "yearly" | undefined
): boolean => {
  if (project.subscription.plan !== PLAN_TO_USAGE_PLAN[plan]) return false;
  if (plan === "agent") return true;
  const start = Date.parse(project.subscription.billingPeriodStart);
  const end = Date.parse(project.subscription.billingPeriodEnd);
  if (Number.isNaN(start) || Number.isNaN(end) || end <= start) return false;
  const days = (end - start) / 86_400_000;
  return period === "yearly"
    ? days >= 350 && days <= 380
    : days >= 25 && days <= 35;
};

const authenticate = async (
  options: SignupOptions
): Promise<{ jwt: string; refId: string; walletAddress: string }> => {
  if ((options as PreauthenticatedSignupOptions).jwt !== undefined) {
    const o = options as PreauthenticatedSignupOptions;
    return { jwt: o.jwt, refId: o.refId, walletAddress: o.walletAddress };
  }
  const sk = (options as SecretKeySignupOptions).secretKey;
  const keypair = loadKeypair(sk);
  const walletAddress = await getAddress(keypair);
  const { message, signature } = await signAuthMessage(sk);
  const auth = await walletSignup(message, signature, walletAddress);
  return { jwt: auth.token, refId: auth.refId, walletAddress };
};

/**
 * Internal — never exported. Resolves priceId, runs `getCheckoutPreview` to
 * detect zero-amount checkouts (rejected in Phase 1), then creates a
 * `payment_required` PaymentLink via `/checkout/initialize` in self-funded
 * mode.
 */
async function createPayment(req: {
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
}): Promise<PaymentLink> {
  const period = req.period ?? "monthly";
  const priceId = await resolvePriceId(req.jwt, req.plan, period);
  // Best-effort zero-amount rejection. The preview endpoint requires an
  // existing Stripe customer for one-time invoices (Agent Plan), which a
  // fresh signup does not have — backend throws "Customer ID is required
  // for one time preview". Swallow that case and continue to
  // /checkout/initialize, which will create the customer + intent and
  // surface its own error if the final amount really is zero. The check
  // still catches 100%-coupon paths on flows where a customer exists
  // (upgrades, re-checkouts).
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
    // Re-throw our own zero-amount rejection.
    if (
      error instanceof Error &&
      error.message.startsWith("Zero-amount signups")
    ) {
      throw error;
    }
    // Otherwise the preview is unreachable for this caller (typically
    // fresh signup with no customer yet). Fall through to initialize.
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
}

/**
 * Phase 1 unified signup. See `SignupResult` for the discriminated outcomes.
 *
 * Existing-project rules:
 * - Same plan + period (or `agent`) → `kind: "already_subscribed"`. Creates an
 *   API key if the project has none, so `apiKey` is always non-null.
 * - Different plan/period → `kind: "upgrade_required"`. Phase 1 cannot create
 *   upgrade intents; use `upgradePlan` in Phase 2.
 *
 * Zero-amount checkouts are rejected up front via `getCheckoutPreview`.
 */
export const signup = async (options: SignupOptions): Promise<SignupResult> => {
  const plan = validatePlan(options.plan);
  // Contact info is required only when creating a fresh payment intent.
  // already_subscribed / upgrade_required short-circuits do not need it,
  // so we validate after existing-project detection (see below).

  const { jwt, refId, walletAddress } = await authenticate(options);

  const projects = await listProjects(jwt);
  if (projects.length > 0) {
    const project = projects[0];
    if (matchesExistingPlan(project, plan, options.period)) {
      const details = await getProject(jwt, project.id);
      let apiKey = details.apiKeys?.[0]?.keyId;
      if (!apiKey) {
        apiKey = (await createApiKey(jwt, project.id, walletAddress)).keyId;
      }
      return {
        kind: "already_subscribed",
        jwt,
        refId,
        walletAddress,
        projectId: project.id,
        apiKey,
        endpoints: buildEndpoints(apiKey) as Endpoints,
      };
    }
    return {
      kind: "upgrade_required",
      jwt,
      refId,
      walletAddress,
      currentPlan: project.subscription.plan,
      requestedPlan: plan,
    };
  }

  // No project → must create a fresh intent. Contact info is required by
  // the backend at /checkout/initialize for any new subscription, so we
  // validate up front (here, not at the top of signup) to give callers a
  // crisp error before the network round trip.
  if (!options.email || !options.firstName || !options.lastName) {
    const missing = [
      !options.email && "email",
      !options.firstName && "firstName",
      !options.lastName && "lastName",
    ]
      .filter(Boolean)
      .join(", ");
    throw new Error(`Signup requires contact info. Missing: ${missing}.`);
  }

  const paymentLink = await createPayment({
    jwt,
    refId,
    plan,
    period: options.period,
    email: options.email,
    firstName: options.firstName,
    lastName: options.lastName,
    couponCode: options.couponCode,
    walletAddress,
    paymentHost: options.paymentHost,
  });
  return {
    kind: "payment_required",
    jwt,
    refId,
    walletAddress,
    paymentLink,
  };
};
