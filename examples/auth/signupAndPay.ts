import { makeAuthClient } from "helius-sdk/auth/client";
import { createHelius } from "helius-sdk";
import type { SignupAndPayResult } from "helius-sdk/auth/types";

type ProjectResult = Extract<
  SignupAndPayResult,
  { kind: "completed" | "already_subscribed" }
>;

/**
 * Phase 1 unified signup — autopay mode.
 *
 * Loads a funded keypair, sends USDC + memo to the treasury, and polls
 * activation. On poll timeout returns `kind: "pending"` carrying the
 * `paymentLink` and `txSignature` so the caller can resume later.
 *
 * Signup never creates an API key. `completed` and `already_subscribed`
 * return the project's existing key, or `apiKey: null` if it has none, so
 * the caller decides when to create one with `createApiKey`.
 */
(async () => {
  const auth = makeAuthClient();

  const ensureApiKey = async (r: ProjectResult): Promise<string> =>
    r.apiKey ??
    (await auth.createApiKey(r.jwt, r.projectId, r.walletAddress)).keyId;

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
      console.log("Signup complete! Project:", result.projectId);
      console.log("Tx signature:", result.txSignature);
      // The project starts with no API key; create one when you need it.
      const apiKey = await ensureApiKey(result);
      console.log("API key:", apiKey);
      const helius = createHelius({ apiKey });
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
      console.log("Project already exists:", result.projectId);
      console.log("API key:", await ensureApiKey(result));
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
