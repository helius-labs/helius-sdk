import type {
  CheckoutInitializeRequest,
  CheckoutInitializeResponse,
  CheckoutStatusResponse,
  CheckoutPreviewResponse,
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

export async function getCheckoutPreview(
  jwt: string,
  priceId: string,
  refId: string,
  couponCode?: string,
  userAgent?: string,
): Promise<CheckoutPreviewResponse> {
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
  userAgent?: string,
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
  userAgent?: string,
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

export async function payPaymentIntent(
  secretKey: Uint8Array,
  intent: CheckoutInitializeResponse,
): Promise<string> {
  // $0 intents are auto-completed by backend — no transaction needed
  if (intent.amount === 0) {
    return "";
  }

  const keypair = loadKeypair(secretKey);
  const walletAddress = await getAddress(keypair);

  const solBalance = await checkSolBalance(walletAddress);
  if (solBalance < MIN_SOL_FOR_TX) {
    throw new Error(
      `Insufficient SOL for transaction fees. Have: ${Number(solBalance) / 1_000_000_000} SOL, need: ~0.001 SOL. Fund address: ${walletAddress}`
    );
  }

  // Convert cents → USDC 6-decimal raw: 4900 cents × 10,000 = 49,000,000 raw = 49.000000 USDC
  const amountRaw = BigInt(intent.amount) * 10_000n;

  const usdcBalance = await checkUsdcBalance(walletAddress);
  if (usdcBalance < amountRaw) {
    throw new Error(
      `Insufficient USDC. Have: ${Number(usdcBalance) / 1_000_000} USDC, need: ${intent.amount / 100} USDC. Fund address: ${walletAddress}`
    );
  }

  // memo is intent.id
  return payWithMemo(secretKey, intent.destinationWallet, amountRaw, intent.id);
}

export async function executeCheckout(
  secretKey: Uint8Array,
  jwt: string,
  request: CheckoutInitializeRequest,
  userAgent?: string,
  options?: { skipProjectPolling?: boolean },
): Promise<CheckoutResult> {
  // 1. Initialize checkout
  const intent = await initializeCheckout(jwt, request, userAgent);

  // 2. Send payment (handles $0 case)
  let txSignature: string | null = null;
  try {
    txSignature = await payPaymentIntent(secretKey, intent) || null;
  } catch (error) {
    return {
      paymentIntentId: intent.id,
      txSignature: null,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  // 3. Poll for payment confirmation
  const checkoutStatus = await pollCheckoutCompletion(
    jwt,
    intent.id,
    userAgent
  );

  if (checkoutStatus.phase === "failed") {
    return {
      paymentIntentId: intent.id,
      txSignature,
      status: "failed",
      error: checkoutStatus.message,
    };
  }

  if (checkoutStatus.phase === "expired") {
    return {
      paymentIntentId: intent.id,
      txSignature,
      status: "expired",
      error: checkoutStatus.message,
    };
  }

  if (!checkoutStatus.readyToRedirect) {
    return {
      paymentIntentId: intent.id,
      txSignature,
      status: "timeout",
    };
  }

  // 4. Optionally poll for project creation
  if (!options?.skipProjectPolling) {
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
      paymentIntentId: intent.id,
      txSignature,
      status: "completed",
      projectId,
      apiKey,
    };
  }

  return {
    paymentIntentId: intent.id,
    txSignature,
    status: "completed",
  };
}

export async function executeUpgrade(
  secretKey: Uint8Array,
  jwt: string,
  priceId: string,
  projectId: string,
  couponCode?: string,
  userAgent?: string,
): Promise<CheckoutResult> {
  const intent = await initializeCheckout(
    jwt,
    { priceId, refId: projectId, couponCode },
    userAgent
  );

  let txSignature: string | null = null;
  try {
    txSignature = await payPaymentIntent(secretKey, intent) || null;
  } catch (error) {
    return {
      paymentIntentId: intent.id,
      txSignature: null,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const status = await pollCheckoutCompletion(jwt, intent.id, userAgent);

  if (status.phase === "failed") {
    return { paymentIntentId: intent.id, txSignature, status: "failed", error: status.message };
  }
  if (status.phase === "expired") {
    return { paymentIntentId: intent.id, txSignature, status: "expired", error: status.message };
  }
  if (!status.readyToRedirect) {
    return { paymentIntentId: intent.id, txSignature, status: "timeout" };
  }

  return { paymentIntentId: intent.id, txSignature, status: "completed" };
}

export async function executeRenewal(
  secretKey: Uint8Array,
  jwt: string,
  paymentIntentId: string,
  userAgent?: string,
): Promise<CheckoutResult> {
  const intent = await getPaymentIntent(jwt, paymentIntentId, userAgent);

  if (intent.status !== "pending") {
    throw new Error(
      `Payment intent is ${intent.status}, cannot pay. Only pending intents can be paid.`
    );
  }

  let txSignature: string | null = null;
  try {
    txSignature = await payPaymentIntent(secretKey, intent) || null;
  } catch (error) {
    return {
      paymentIntentId: intent.id,
      txSignature: null,
      status: "failed",
      error: error instanceof Error ? error.message : String(error),
    };
  }

  const status = await pollCheckoutCompletion(jwt, intent.id, userAgent);

  if (status.phase === "failed") {
    return { paymentIntentId: intent.id, txSignature, status: "failed", error: status.message };
  }
  if (status.phase === "expired") {
    return { paymentIntentId: intent.id, txSignature, status: "expired", error: status.message };
  }
  if (!status.readyToRedirect) {
    return { paymentIntentId: intent.id, txSignature, status: "timeout" };
  }

  return { paymentIntentId: intent.id, txSignature, status: "completed" };
}
