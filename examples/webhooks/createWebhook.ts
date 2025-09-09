import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const webhook = await helius.webhooks.create({
      webhookURL: "https://your-server.com/webhook",
      transactionTypes: ["TRANSFER"],
      accountAddresses: ["your-account"],
      webhookType: "enhanced",
    });
    console.log("Created webhook:", webhook);
  } catch (error) {
    console.error("Error:", error);
  }
})();