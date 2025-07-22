// Replace imports in a production setting
import { createHelius } from "../../src/rpc/index";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const assetId = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"; // Example BONK mint

  let rpc = createHelius({ apiKey });
  try {
    const assetSlim = await rpc.getAsset(assetId);
    console.log("Asset from RPC:", assetSlim);
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();
