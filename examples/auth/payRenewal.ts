import { makeAuthClient } from "helius-sdk/auth/client";

/**
 * Phase 2 — pay a renewal invoice for an existing subscription, using USDC
 * from the local keypair.
 *
 * Unlike `upgradePlan`, this does NOT create a new payment intent — it
 * fetches an existing pending intent (typically surfaced via the renewal
 * notification email or the dashboard) and pays it. Renewals don't go
 * through a webhook-driven activation gate, so `kind: "completed"` flips
 * on payment confirmation alone.
 *
 * For link-only flows (e.g. you want to hand a hosted-checkout URL to a UI
 * instead of auto-paying from a keypair), call `auth.payRenewal(...)`
 * instead — it returns the same `paymentLink` without sending USDC.
 */
(async () => {
  const auth = makeAuthClient("helius-sdk-example/renewal");

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

  // Paste the paymentIntentId from the renewal-due email or dashboard.
  const paymentIntentId = "pi_REPLACE_ME";

  const result = await auth.payRenewalAndPay(secretKey, jwt, paymentIntentId);

  switch (result.kind) {
    case "completed":
      console.log("Renewal paid!");
      console.log("Tx signature:", result.txSignature);
      console.log("Payment intent:", result.paymentIntentId);
      break;
    case "pending":
      console.log(
        "USDC sent (tx:",
        result.txSignature,
        "), but confirmation polling timed out. Re-poll later via:"
      );
      console.log(" ", result.paymentLink.paymentUrl);
      break;
    case "expired":
    case "failed":
      console.error(
        `Renewal ${result.kind}.`,
        "reason" in result ? result.reason : ""
      );
      break;
  }
})();
