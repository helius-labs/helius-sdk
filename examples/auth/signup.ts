import { makeAuthClient } from "helius-sdk/auth/client";

/**
 * Phase 1 unified signup — link mode.
 *
 * The SDK creates a payment intent and returns a hosted-checkout link the
 * user can open in a browser. They pay USDC there; the backend webhook
 * provisions the account. To finish provisioning locally, run the same
 * flow again with the stored intent (e.g. via `signupAndPay` or by
 * polling `getPaymentStatus` with `paymentLink.paymentIntentId`).
 */
(async () => {
  const auth = makeAuthClient();
  const { secretKey } = await auth.generateKeypair();

  const result = await auth.signup({
    secretKey,
    plan: "agent",
    email: "you@example.com",
    firstName: "Jane",
    lastName: "Doe",
  });

  if (result.kind === "payment_required") {
    console.log("Open this link in a browser to pay:");
    console.log(" ", result.paymentLink.paymentUrl);
    console.log("Or send", result.paymentLink.amountCents / 100, "USDC to");
    console.log(" ", result.paymentLink.destinationWallet);
    console.log("with memo =", result.paymentLink.memo);
  } else if (result.kind === "already_subscribed") {
    console.log("Project already exists; API key:", result.apiKey);
  } else if (result.kind === "upgrade_required") {
    console.log(
      `Wallet is on plan "${result.currentPlan}"; switching to ` +
        `"${result.requestedPlan}" requires upgradePlan (Phase 2).`
    );
  }
})();
