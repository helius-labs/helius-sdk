import { makeAuthClient } from "helius-sdk/auth/client";

/**
 * Buy additional prepaid credits for an agent-plan project.
 *
 * Agent-only in this release. Each unit of `qty` grants 1,000,000 credits
 * at the backend. 10 USDC × qty=1 → 1M credits; 10 × 3 → 3M credits.
 * SOL fees are sponsored.
 */
(async () => {
  const auth = makeAuthClient("helius-sdk-example/credits");

  // Load the same keypair used for signup (paste your saved bytes).
  const secretKey = new Uint8Array(
    /* paste 64-byte secretKey array here */
  );
  const keypair = auth.loadKeypair(secretKey);
  const walletAddress = await auth.getAddress(keypair);

  // Authenticate the wallet to get a JWT.
  const { message, signature } = await auth.signAuthMessage(secretKey);
  const { token: jwt } = await auth.walletSignup(
    message,
    signature,
    walletAddress
  );

  // Use the existing agent-plan project (first project on the account).
  const projects = await auth.listProjects(jwt);
  const projectId = projects[0]?.id;
  if (!projectId) throw new Error("No project found — sign up first.");

  const result = await auth.purchaseCredits(secretKey, jwt, {
    tier: "10_USDC", // default; omit to use the default
    qty: 1,
    projectId,
  });

  console.log("Status:", result.status);
  console.log("TX:", result.txSignature);
  console.log("Amount (cents):", result.amountCents);
})();
