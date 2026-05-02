import { makeAuthClient } from "helius-sdk/auth/client";
import { createHelius } from "helius-sdk";

/**
 * Phase 1 unified signup — autopay mode.
 *
 * Loads a funded keypair, sends USDC + memo to the treasury, and polls
 * activation. On poll timeout returns `kind: "pending"` carrying the
 * `paymentLink` and `txSignature` so the caller can resume later.
 */
(async () => {
  const auth = makeAuthClient();

  // Replace with your funded keypair (needs ~0.001 SOL + the plan cost in USDC).
  const { secretKey } = await auth.generateKeypair();

  const result = await auth.signupAndPay({
    secretKey,
    plan: "agent",
    email: "you@example.com",
    firstName: "Jane",
    lastName: "Doe",
  });

  switch (result.kind) {
    case "completed": {
      console.log("Signup complete!");
      console.log("API key:", result.apiKey);
      console.log("Tx signature:", result.txSignature);
      const helius = createHelius({ apiKey: result.apiKey });
      console.log("Current slot:", await helius.getSlot());
      break;
    }
    case "pending":
      console.log(
        "USDC sent (tx:",
        result.txSignature,
        "), but activation polling timed out. Re-poll with paymentLink later:",
      );
      console.log(" ", result.paymentLink.paymentUrl);
      break;
    case "already_subscribed":
      console.log("Project already exists; API key:", result.apiKey);
      break;
    case "upgrade_required":
      console.log(
        `Wallet is on "${result.currentPlan}" — use upgradePlan (Phase 2).`,
      );
      break;
    case "expired":
    case "failed":
      console.error(
        `Payment ${result.kind}.`,
        "reason" in result ? result.reason : "",
      );
      break;
  }
})();
