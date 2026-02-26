import type { AgenticSignupOptions, AgenticSignupResult } from "./types";
import { loadKeypair } from "./loadKeypair";
import { getAddress } from "./getAddress";
import { signAuthMessage } from "./signAuthMessage";
import { walletSignup } from "./walletSignup";
import { listProjects } from "./listProjects";
import { getProject } from "./getProject";
import { executeCheckout } from "./checkout";
import { OPENPAY_PLANS } from "./constants";
import { isOpenPayPlan, buildEndpoints } from "./signupHelpers";
import { executeBasicSignup } from "./basicSignup";

export async function agenticSignup(
  options: AgenticSignupOptions
): Promise<AgenticSignupResult> {
  const { secretKey, userAgent, email, firstName, lastName } = options;

  // Normalize plan: undefined/empty → "basic"
  const rawPlan = options.plan?.trim() || "";
  const plan = rawPlan === "" ? "basic" : rawPlan.toLowerCase();

  // Validate plan
  if (plan !== "basic" && !isOpenPayPlan(plan)) {
    throw new Error(
      `Unknown plan: ${plan}. Available: basic, ${OPENPAY_PLANS.join(", ")}`
    );
  }

  // Load keypair and derive address
  const keypair = loadKeypair(secretKey);
  const walletAddress = await getAddress(keypair);

  // Authenticate
  const { message, signature } = await signAuthMessage(secretKey);
  const auth = await walletSignup(message, signature, walletAddress, userAgent);
  const jwt = auth.token;

  // Check for existing projects
  const existingProjects = await listProjects(jwt, userAgent);

  if (existingProjects.length > 0) {
    const project = existingProjects[0];
    const projectDetails = await getProject(jwt, project.id, userAgent);
    const apiKey = projectDetails.apiKeys?.[0]?.keyId || null;

    // Existing user + OpenPay plan → upgrade
    if (isOpenPayPlan(plan)) {
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

    // Existing user + basic plan → return existing project
    return {
      status: "existing_project",
      jwt,
      walletAddress,
      projectId: project.id,
      apiKey,
      endpoints: apiKey ? buildEndpoints(apiKey) : null,
      credits: projectDetails.creditsUsage?.remainingCredits ?? null,
    };
  }

  // ── New user paths ──

  if (isOpenPayPlan(plan)) {
    // Validate required contact info for new subscriptions
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

    // OpenPay checkout for developer/business/professional
    const checkoutResult = await executeCheckout(
      secretKey,
      jwt,
      {
        plan,
        period: options.period ?? "monthly",
        refId: auth.refId,
        email,
        firstName,
        lastName,
        couponCode: options.couponCode,
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

  // Basic plan ($1 USDC) → balance checks → pay → createProject
  return executeBasicSignup(secretKey, jwt, walletAddress, userAgent);
}
