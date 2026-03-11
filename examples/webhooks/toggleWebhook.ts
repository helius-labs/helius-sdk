import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    // Re-enable an auto-disabled webhook
    const webhook = await helius.webhooks.toggle(
      "your_webhook_ID_goes_here",
      true
    );
    console.log("Toggled webhook:", webhook);
    console.log("Active:", webhook.active);
  } catch (error) {
    console.error("Error toggling webhook:", error);
  }
})();
