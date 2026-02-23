import type {
  AgenticSignupOptions,
  AgenticSignupResult,
  Project,
} from "./types";
import { loadKeypair } from "./loadKeypair";
import { getAddress } from "./getAddress";
import { signAuthMessage } from "./signAuthMessage";
import { walletSignup } from "./walletSignup";
import { listProjects } from "./listProjects";
import { getProject } from "./getProject";
import { checkSolBalance, checkUsdcBalance } from "./checkBalances";
import { payUSDC } from "./payUSDC";
import { createProject } from "./createProject";
import { executeCheckout, executeUpgrade } from "./checkout";
import { OPENPAY_PLANS, MIN_SOL_FOR_TX, PAYMENT_AMOUNT } from "./constants";

function isOpenPayPlan(plan: string): boolean {
  return (OPENPAY_PLANS as readonly string[]).includes(plan);
}

function buildEndpoints(apiKey: string) {
  return {
    mainnet: `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
    devnet: `https://devnet.helius-rpc.com/?api-key=${apiKey}`,
  };
}

function isRetryableError(error: unknown): boolean {
  if (error instanceof Error) {
    const match = error.message.match(/API error \((\d+)\)/);
    if (match) {
      const status = parseInt(match[1], 10);
      return status >= 500;
    }
    // Network errors (no status code) are retryable
    return true;
  }
  return true;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function createProjectWithRetry(
  jwt: string,
  userAgent: string | undefined,
  maxRetries = 3,
  delayMs = 2000
): Promise<Project> {
  let lastError: Error | null = null;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await createProject(jwt, userAgent);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      if (!isRetryableError(error)) {
        throw lastError;
      }
      if (i < maxRetries - 1) {
        await sleep(delayMs);
      }
    }
  }

  throw lastError;
}

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
      const upgradeResult = await executeUpgrade(
        secretKey,
        jwt,
        plan,
        options.period ?? "monthly",
        project.id,
        options.couponCode,
        userAgent
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

    return {
      status: "success",
      jwt,
      walletAddress,
      projectId: checkoutResult.projectId!,
      apiKey: checkoutResult.apiKey || null,
      endpoints: checkoutResult.apiKey
        ? buildEndpoints(checkoutResult.apiKey)
        : null,
      credits: null,
      txSignature: checkoutResult.txSignature ?? undefined,
    };
  }

  // Basic plan ($1 USDC) → balance checks → pay → createProject
  const solBalance = await checkSolBalance(walletAddress);
  if (solBalance < MIN_SOL_FOR_TX) {
    throw new Error(
      `Insufficient SOL for transaction fees. Have: ${Number(solBalance) / 1_000_000_000} SOL, need: ~0.001 SOL. Fund address: ${walletAddress}`
    );
  }

  const usdcBalance = await checkUsdcBalance(walletAddress);
  if (usdcBalance < PAYMENT_AMOUNT) {
    throw new Error(
      `Insufficient USDC. Have: ${Number(usdcBalance) / 1_000_000} USDC, need: 1 USDC. Fund address: ${walletAddress}`
    );
  }

  const txSignature = await payUSDC(secretKey);
  const project = await createProjectWithRetry(jwt, userAgent);

  const projectDetails = await getProject(jwt, project.id, userAgent);
  const apiKey =
    projectDetails.apiKeys?.[0]?.keyId || project.apiKeys?.[0]?.keyId || null;

  return {
    status: "success",
    jwt,
    walletAddress,
    projectId: project.id,
    apiKey,
    endpoints: apiKey ? buildEndpoints(apiKey) : null,
    credits: projectDetails.creditsUsage?.remainingCredits ?? null,
    txSignature,
  };
}
