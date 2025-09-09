import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const webhook = await helius.webhooks.update("your_webhook_ID_goes_here", {
      webhookURL: "https://rebel-alliance.com/updated-webhook-yavin",
      transactionTypes: ["NFT_MINT", "TRANSFER"],
      accountAddresses: ["alderaan-treasury.sol", "endor-forest.sol"],
      webhookType: "enhanced",
      authHeader: "UseTheForceLuke",
      encoding: "base64",
      txnStatus: "success",
    });
    console.log("Updated webhook:", webhook);
  } catch (error) {
    console.error("Error updating webhook:", error);
  }
})();