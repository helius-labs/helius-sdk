import { PLAN_TO_USAGE_PLAN } from "./constants";
import { loadKeypair } from "./loadKeypair";
import { getAddress } from "./getAddress";
import { signAuthMessage } from "./signAuthMessage";
import { walletSignup } from "./walletSignup";
import { listProjects } from "./listProjects";
import { getProject } from "./getProject";
import { createApiKey } from "./createApiKey";
import { buildEndpoints } from "./signupHelpers";
import { createPayment } from "./createPayment";
import type {
  Endpoints,
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
