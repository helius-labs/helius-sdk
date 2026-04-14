import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const projectId = ""; // UUID of the project associated with the API key
  const helius = createHelius({ apiKey });

  try {
    const usage = await helius.admin.getProjectUsage(projectId);

    console.log("\nProject Usage:");
    console.log("=".repeat(80));
    console.log(`Project ID: ${projectId}`);
    console.log(`Credits Used: ${usage.creditsUsed}`);
    console.log(`Credits Remaining: ${usage.creditsRemaining}`);
    console.log(`Prepaid Credits Used: ${usage.prepaidCreditsUsed}`);
    console.log(
      `Prepaid Credits Remaining: ${usage.prepaidCreditsRemaining}`
    );

    console.log("\nSubscription Details:");
    console.log(`Plan: ${usage.subscriptionDetails.plan}`);
    console.log(`Credits Limit: ${usage.subscriptionDetails.creditsLimit}`);
    console.log(
      `Billing Cycle: ${usage.subscriptionDetails.billingCycle.start} → ${usage.subscriptionDetails.billingCycle.end}`
    );

    console.log("\nUsage Breakdown:");
    console.log(`RPC: ${usage.usage.rpc}`);
    console.log(`DAS: ${usage.usage.das}`);
    console.log(`Webhooks: ${usage.usage.webhook}`);
    console.log(`WebSockets: ${usage.usage.websocket}`);
    console.log(`API: ${usage.usage.api}`);
    console.log(`gRPC: ${usage.usage.grpc}`);
    console.log(`gRPC Geyser: ${usage.usage.grpcGeyser}`);
    console.log(`Archival: ${usage.usage.archival}`);
    console.log(`Photon: ${usage.usage.photon}`);
    console.log(`Stream: ${usage.usage.stream}`);
  } catch (error: any) {
    console.error("\nError fetching project usage:", error.message);
  }
})();
