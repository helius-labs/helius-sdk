// Replace imports in a production setting
import { createHeliusRpc } from "../../src/rpc/index";
import { createHeliusRpcFull } from "../../src/rpc/full";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const assetId = "DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263"; // Example BONK mint

  // Full factory with 
  const fullRpc = createHeliusRpcFull({ apiKey });
  try {
    const assetFull = await fullRpc.getAsset({ id: assetId, options: { showFungible: true }});
    console.log("Asset from full RPC:", assetFull);
  } catch (error) {
    console.error("Error with full RPC:", error);
  }

  // Slim factory
  let slimRpc = createHeliusRpc({ apiKey });
  try {
    const assetSlim = await slimRpc.getAsset(assetId);
    console.log("Asset from slim RPC:", assetSlim);
  } catch (error) {
    console.error("Error with slim RPC:", error);
  }
})();
