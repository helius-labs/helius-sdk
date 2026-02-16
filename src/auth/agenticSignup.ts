import type { AgenticSignupOptions, AgenticSignupResult } from "./types";
import { loadKeypair } from "./loadKeypair";
import { getAddress } from "./getAddress";
import { signAuthMessage } from "./signAuthMessage";
import { walletSignup } from "./walletSignup";
import { listProjects } from "./listProjects";
import { getProject } from "./getProject";
import { executeCheckout } from "./checkout";

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

  // Execute checkout flow (init → balance check → pay → poll → project)
  const checkoutResult = await executeCheckout(
    secretKey,
    jwt,
    {
      paymentType: "subscription",
    },
    userAgent
  );

  if (checkoutResult.status !== "completed") {
    throw new Error(
      `Checkout ${checkoutResult.status}${checkoutResult.txSignature ? `. TX: ${checkoutResult.txSignature}` : ""}`
    );
  }

  const txSignature = checkoutResult.txSignature;
  const projectId = checkoutResult.projectId;
  const apiKey = checkoutResult.apiKey || null;

  return {
    status: "success",
    jwt,
    walletAddress,
    projectId: projectId!,
    apiKey,
    endpoints: apiKey
      ? {
          mainnet: `https://mainnet.helius-rpc.com/?api-key=${apiKey}`,
          devnet: `https://devnet.helius-rpc.com/?api-key=${apiKey}`,
        }
      : null,
    credits: null,
    txSignature: txSignature ?? undefined,
  };
}
