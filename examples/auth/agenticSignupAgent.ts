import { makeAuthClient } from "helius-sdk/auth/client";
import { createHelius } from "helius-sdk";

/**
 * Sign up for the Agent Plan.
 *
 * Agent is a one-time 10 USDC purchase that provisions 1,000,000 starting
 * credits. Contact info (email, firstName, lastName) is required for
 * new-user signups on any paid plan. SOL fees are sponsored — the user's
 * keypair only needs USDC.
 */
(async () => {
  const auth = makeAuthClient("helius-sdk-example/agent");

  const { secretKey } = await auth.generateKeypair();

  const result = await auth.agenticSignup({
    secretKey,
    plan: "agent",
    email: "agent@example.com",
    firstName: "Agent",
    lastName: "User",
    // period is ignored for the agent plan (one-time invoice).
  });

  console.log("Status:", result.status); // "success" (new) or "upgraded"
  console.log("Wallet:", result.walletAddress);
  console.log("Project ID:", result.projectId);
  console.log("API Key:", result.apiKey);
  console.log("Payment TX:", result.txSignature);

  if (result.apiKey) {
    // Agent plan ships with 1,000,000 credits — the API is usable immediately.
    const helius = createHelius({ apiKey: result.apiKey });
    const slot = await helius.getSlot();
    console.log("Current slot:", slot);
  }
})();
