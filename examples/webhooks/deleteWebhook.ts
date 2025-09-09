import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    await helius.webhooks.delete("your_webhook_ID_goes_here");
    console.log("Webhook deleted successfully");
  } catch (error) {
    console.error("Error:", error);
  }
})();