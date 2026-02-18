import { makeAuthClient } from "helius-sdk/auth/client";
import { createHelius } from "helius-sdk";

(async () => {
  const auth = makeAuthClient();

  // Step 1: Generate a new wallet keypair (or load existing via auth.loadKeypair)
  const { secretKey } = await auth.generateKeypair();

  // Step 2: Full agentic signup flow
  //   - Signs auth message to verify wallet ownership
  //   - If existing project found, returns its API key
  //   - Otherwise checks SOL/USDC balances, pays 1 USDC, creates project
  const result = await auth.agenticSignup({ secretKey });

  console.log("Status:", result.status); // "success" or "existing_project"
  console.log("Wallet:", result.walletAddress);
  console.log("Project ID:", result.projectId);
  console.log("API Key:", result.apiKey);
  console.log("Endpoints:", result.endpoints);
  console.log("Credits:", result.credits);

  if (result.txSignature) {
    console.log("Payment TX:", result.txSignature);
  }

  // Step 3: Use the API key with the SDK
  if (result.apiKey) {
    const helius = createHelius({ apiKey: result.apiKey });
    const slot = await helius.getSlot();
    console.log("Current slot:", slot);
  }
})();
