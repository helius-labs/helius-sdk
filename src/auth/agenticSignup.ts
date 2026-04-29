import type { AgenticSignupOptions, AgenticSignupResult } from "./types";
import { loadKeypair } from "./loadKeypair";
import { getAddress } from "./getAddress";
import { signAuthMessage } from "./signAuthMessage";
import { walletSignup } from "./walletSignup";
import { listProjects } from "./listProjects";
import { getProject } from "./getProject";
import { executeCheckout } from "./checkout";
import { AGENT_PLANS, OPENPAY_PLANS } from "./constants";
import { isAgentPlan, isOpenPayPlan, buildEndpoints } from "./signupHelpers";

const ALL_PLANS = [...OPENPAY_PLANS, ...AGENT_PLANS];

// New-account checkouts are sponsored; upgrades are not (backend rejects
// sponsored mode on the upgrade path). To get a sponsored agent setup,
// sign up from a fresh wallet rather than upgrading an existing project.
export async function agenticSignup(
  options: AgenticSignupOptions
): Promise<AgenticSignupResult> {
  const { secretKey, userAgent, email, firstName, lastName } = options;

  // Normalize plan: undefined/empty → "agent" (new default entry plan).
  const rawPlan = options.plan?.trim() || "";
  const plan = rawPlan === "" ? "agent" : rawPlan.toLowerCase();

  // Validate plan
  if (!isOpenPayPlan(plan) && !isAgentPlan(plan)) {
    throw new Error(
      `Unknown plan: ${plan}. Available: ${ALL_PLANS.join(", ")}`
    );
  }

  // Pre-authenticated session reuse: if the caller already ran walletSignup
  // (e.g. to fetch a pricing quote), let them pass jwt + refId to skip the
  // internal re-auth round trip.
  const keypair = loadKeypair(secretKey);
  const walletAddress = await getAddress(keypair);

  let jwt: string;
  let refId: string;
  if (options.jwt && options.refId) {
    jwt = options.jwt;
    refId = options.refId;
  } else if (options.jwt || options.refId) {
    throw new Error(
      "agenticSignup: pass both `jwt` and `refId` together, or neither."
    );
  } else {
    const { message, signature } = await signAuthMessage(secretKey);
    const auth = await walletSignup(
      message,
      signature,
      walletAddress,
      userAgent
    );
    jwt = auth.token;
    refId = auth.refId;
  }

  // Check for existing projects
  const existingProjects = await listProjects(jwt, userAgent);

  if (existingProjects.length > 0) {
    const project = existingProjects[0];
    const projectDetails = await getProject(jwt, project.id, userAgent);
    const apiKey = projectDetails.apiKeys?.[0]?.keyId || null;

    // All-or-none customer info validation
    const hasAny = email || firstName || lastName;
    if (hasAny && (!email || !firstName || !lastName)) {
      const missing = [
        !email && "email",
        !firstName && "firstName",
        !lastName && "lastName",
      ].filter(Boolean);
      throw new Error(
        `Partial customer info provided. If any of email/firstName/lastName is given, all three are required. Missing: ${missing.join(", ")}`
      );
    }

    const upgradeResult = await executeCheckout(
      secretKey,
      jwt,
      {
        plan,
        period: options.period ?? "monthly",
        refId: project.id,
        couponCode: options.couponCode,
        email,
        firstName,
        lastName,
      },
      userAgent,
      { skipProjectPolling: true }
    );

    if (upgradeResult.status !== "completed") {
      throw new Error(
        `Checkout ${upgradeResult.status}${upgradeResult.error ? `: ${upgradeResult.error}` : ""}${upgradeResult.txSignature ? `. TX: ${upgradeResult.txSignature}` : ""}`
      );
    }

    return {
      status: "upgraded",
      jwt,
      walletAddress,
      projectId: project.id,
      apiKey,
      endpoints: apiKey ? buildEndpoints(apiKey) : null,
      credits: null,
      txSignature: upgradeResult.txSignature ?? undefined,
    };
  }

  // ── New user path ── All supported plans go through sponsored checkout

  if (!email || !firstName || !lastName) {
    const missing = [
      !email && "email",
      !firstName && "firstName",
      !lastName && "lastName",
    ].filter(Boolean);
    throw new Error(
      `Paid plans require contact info for new accounts. Missing: ${missing.join(", ")}. ` +
        `Pass --email, --first-name, and --last-name.`
    );
  }

  // Checkout for all plans (developer, business, professional, agent).
  // Always use sponsored mode — payPaymentIntent falls back to self-funded if needed.
  const checkoutResult = await executeCheckout(
    secretKey,
    jwt,
    {
      plan,
      period: options.period ?? "monthly",
      refId,
      email,
      firstName,
      lastName,
      walletAddress,
      couponCode: options.couponCode,
      paymentMode: "sponsored",
    },
    userAgent
  );

  if (checkoutResult.status !== "completed") {
    throw new Error(
      `Checkout ${checkoutResult.status}${checkoutResult.error ? `: ${checkoutResult.error}` : ""}${checkoutResult.txSignature ? `. TX: ${checkoutResult.txSignature}` : ""}`
    );
  }

  if (!checkoutResult.projectId) {
    throw new Error(
      "Checkout completed but no project was provisioned. " +
        `Payment intent: ${checkoutResult.paymentIntentId}`
    );
  }

  return {
    status: "success",
    jwt,
    walletAddress,
    projectId: checkoutResult.projectId,
    apiKey: checkoutResult.apiKey || null,
    endpoints: checkoutResult.apiKey
      ? buildEndpoints(checkoutResult.apiKey)
      : null,
    credits: null,
    txSignature: checkoutResult.txSignature ?? undefined,
  };
}
