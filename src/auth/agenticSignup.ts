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
import { createProject } from "./createProject";
import { getProject } from "./getProject";
import { checkSolBalance, checkUsdcBalance } from "./checkBalances";
import { payUSDC } from "./payUSDC";
import { MIN_SOL_FOR_TX, PAYMENT_AMOUNT } from "./constants";

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
  const { secretKey, userAgent } = options;

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

    return {
      status: "existing_project",
      jwt,
      walletAddress,
      projectId: project.id,
      apiKey,
      endpoints: apiKey
        ? {
            mainnet: `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
            devnet: `https://devnet.helius-rpc.com/?api-key=${apiKey}`,
          }
        : null,
      credits: projectDetails.creditsUsage?.remainingCredits ?? null,
    };
  }

  // Check balances
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

  // Send payment
  const txSignature = await payUSDC(secretKey);

  // Create project with retry (backend needs time to verify payment)
  const project = await createProjectWithRetry(jwt, userAgent, 3, 2000);
  const projectDetails = await getProject(jwt, project.id, userAgent);
  const apiKey =
    projectDetails.apiKeys?.[0]?.keyId || project.apiKeys?.[0]?.keyId || null;

  return {
    status: "success",
    jwt,
    walletAddress,
    projectId: project.id,
    apiKey,
    endpoints: apiKey
      ? {
          mainnet: `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
          devnet: `https://devnet.helius-rpc.com/?api-key=${apiKey}`,
        }
      : null,
    credits: projectDetails.creditsUsage?.remainingCredits ?? 1000000,
    txSignature,
  };
}
