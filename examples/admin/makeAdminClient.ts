import { makeAdminClient } from "helius-sdk/admin/client";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const projectId = ""; // UUID of the project associated with the API key
  const admin = makeAdminClient(apiKey);

  try {
    const usage = await admin.getProjectUsage(projectId);

    console.log("\nAdmin Client Project Usage:");
    console.log("=".repeat(80));
    console.log(`Project ID: ${projectId}`);
    console.log(`Credits Used: ${usage.creditsUsed}`);
    console.log(`Credits Remaining: ${usage.creditsRemaining}`);
    console.log(
      `Billing Cycle: ${usage.subscriptionDetails.billingCycle.start} → ${usage.subscriptionDetails.billingCycle.end}`
    );
    console.log(`Plan: ${usage.subscriptionDetails.plan}`);
  } catch (error: any) {
    console.error("\nError fetching project usage:", error.message);
  }
})();
