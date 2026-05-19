import { makeAuthClient } from "helius-sdk/auth/client";

/**
 * Phase 2 — upgrade an existing project to a new plan, paying via USDC
 * from the local keypair and polling activation.
 *
 * Use this when the wallet already owns a Helius project (e.g. from a prior
 * `signupAndPay`) and wants to move from `agent` → `developer` / `business` /
 * `professional`, or change billing period. On poll timeout returns
 * `kind: "pending"` carrying the `paymentLink` + `txSignature` so the caller
 * can resume later.
 *
 * For link-only flows (e.g. you want to hand a hosted-checkout URL to a UI
 * instead of auto-paying from a keypair), call `auth.upgradePlan(...)` instead
 * — it returns the same `paymentLink` without sending USDC.
 */
(async () => {
  const auth = makeAuthClient("helius-sdk-example/upgrade");

  // Load the same keypair used for signup. Paste its 64 saved bytes here.
  const secretKey = Uint8Array.from([
    // 12, 34, 56, ... (64 entries)
  ]);
  const keypair = auth.loadKeypair(secretKey);
  const walletAddress = await auth.getAddress(keypair);

  // Authenticate the wallet to get a JWT.
  const { message, signature } = await auth.signAuthMessage(secretKey);
  const { token: jwt } = await auth.walletSignup(
    message,
    signature,
    walletAddress
  );

  // Use the existing project (first project on the account).
  const projects = await auth.listProjects(jwt);
  const projectId = projects[0]?.id;
  if (!projectId) throw new Error("No project found — sign up first.");

  const result = await auth.upgradePlanAndPay({
    secretKey,
    jwt,
    projectId,
    plan: "business",
    period: "monthly",
    // Contact info is optional on upgrade — the backend reuses the existing
    // Stripe customer when present.
  });

  switch (result.kind) {
    case "completed":
      console.log("Upgrade complete!");
      console.log("Tx signature:", result.txSignature);
      console.log("Payment intent:", result.paymentIntentId);
      break;
    case "pending":
      console.log(
        "USDC sent (tx:",
        result.txSignature,
        "), but activation polling timed out. Re-poll later via:"
      );
      console.log(" ", result.paymentLink.paymentUrl);
      break;
    case "expired":
    case "failed":
      console.error(
        `Upgrade ${result.kind}.`,
        "reason" in result ? result.reason : ""
      );
      break;
  }
})();
