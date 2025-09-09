import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const webhook = await helius.webhooks.getAll();
    console.log("Fetched webhook:", webhook);
  } catch (error) {
    console.error("Error:", error);
  }
})();