import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const assetId = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"; // Example BONK mint

  const helius = createHelius({ apiKey });
  
  try {
    const asset = await helius.getAsset({ id: assetId });
    console.log("Asset from RPC: ", asset);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
