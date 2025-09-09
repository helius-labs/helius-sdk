import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey }); 

  try {
    const webhook = await helius.webhooks.get("your_webhook_ID_goes_here");
    console.log("Fetched webhook:", webhook);
  } catch (error) {
    console.error("Error:", error);
  }
})();