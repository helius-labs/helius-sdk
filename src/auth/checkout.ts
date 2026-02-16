import type {
  CheckoutInitializeRequest,
  CheckoutInitializeResponse,
  CheckoutStatusResponse,
  CheckoutResult,
} from "./types";
import { authRequest } from "./utils";
import { loadKeypair } from "./loadKeypair";
import { getAddress } from "./getAddress";
import { checkSolBalance, checkUsdcBalance } from "./checkBalances";
import { payWithMemo } from "./payWithMemo";
import { listProjects } from "./listProjects";
import { getProject } from "./getProject";
import {
  MIN_SOL_FOR_TX,
  CHECKOUT_POLL_INTERVAL_MS,
  CHECKOUT_POLL_TIMEOUT_MS,
  PROJECT_POLL_INTERVAL_MS,
  PROJECT_POLL_TIMEOUT_MS,
} from "./constants";

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    const status = await authRequest<CheckoutStatusResponse>(
      `/checkout/${paymentIntentId}/status`,
      {
        method: "GET",
        headers: { Authorization: `Bearer ${jwt}` },
      },
      userAgent
    );

    if (
      status.status === "completed" ||
      status.status === "expired" ||
      status.status === "failed"
    ) {
      return status;
    }

    await sleep(intervalMs);
  }

  return {
    paymentIntentId,
    status: "pending",
  };
}

export async function executeCheckout(
  secretKey: Uint8Array,
  jwt: string,
  request: CheckoutInitializeRequest,
  userAgent?: string
): Promise<CheckoutResult> {
  // 1. Initialize checkout
  const intent = await initializeCheckout(jwt, request, userAgent);

  // 2. Derive wallet address
  const keypair = loadKeypair(secretKey);
  const walletAddress = await getAddress(keypair);

  // 3. Check balances
  const amountRaw = BigInt(Math.round(intent.amount * 1_000_000));

  const solBalance = await checkSolBalance(walletAddress);
  if (solBalance < MIN_SOL_FOR_TX) {
    throw new Error(
      `Insufficient SOL for transaction fees. Have: ${Number(solBalance) / 1_000_000_000} SOL, need: ~0.001 SOL. Fund address: ${walletAddress}`
    );
  }

  const usdcBalance = await checkUsdcBalance(walletAddress);
  if (usdcBalance < amountRaw) {
    throw new Error(
      `Insufficient USDC. Have: ${Number(usdcBalance) / 1_000_000} USDC, need: ${intent.amount} USDC. Fund address: ${walletAddress}`
    );
  }

  // 4. Send payment with memo
  let txSignature: string | null = null;
  try {
    txSignature = await payWithMemo(
      secretKey,
      intent.treasuryWallet,
      amountRaw,
      intent.memo
    );
  } catch (error) {
    return {
      paymentIntentId: intent.paymentIntentId,
      txSignature: null,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // 5. Poll for payment confirmation
  const checkoutStatus = await pollCheckoutCompletion(
    jwt,
    intent.paymentIntentId,
    userAgent
  );

  if (checkoutStatus.status !== "completed") {
    return {
      paymentIntentId: intent.paymentIntentId,
      txSignature,
      status:
        checkoutStatus.status === "pending" ? "timeout" : checkoutStatus.status,
      error: checkoutStatus.failureReason,
    };
  }

  // 6. Poll for project creation
  const projectDeadline = Date.now() + PROJECT_POLL_TIMEOUT_MS;
  let projectId: string | undefined;
  let apiKey: string | undefined;

  while (Date.now() < projectDeadline) {
    const projects = await listProjects(jwt, userAgent);
    if (projects.length > 0) {
      projectId = projects[0].id;
      const details = await getProject(jwt, projectId, userAgent);
      apiKey = details.apiKeys?.[0]?.keyId;
      break;
    }
    await sleep(PROJECT_POLL_INTERVAL_MS);
  }

  return {
    paymentIntentId: intent.paymentIntentId,
    txSignature,
    status: "completed",
    projectId,
    apiKey,
  };
}
