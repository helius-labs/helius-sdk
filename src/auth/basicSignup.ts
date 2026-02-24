import type { AgenticSignupResult } from "./types";
import { checkSolBalance, checkUsdcBalance } from "./checkBalances";
import { payUSDC } from "./payUSDC";
import { createProject } from "./createProject";
import { getProject } from "./getProject";
import { retryWithBackoff } from "./retry";
import { buildEndpoints } from "./signupHelpers";
import { MIN_SOL_FOR_TX, PAYMENT_AMOUNT } from "./constants";

export async function executeBasicSignup(
  secretKey: Uint8Array,
  jwt: string,
  walletAddress: string,
  userAgent: string | undefined
): Promise<AgenticSignupResult> {
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
  const project = await retryWithBackoff(() => createProject(jwt, userAgent));

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
