// Replace imports in a production setting
import { createHelius } from "../../src/rpc/index";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const assetId = "Bu1DEKeawy7txbnCEJE4BU3BKLXaNAKCYcHR4XhndGss"; // Example BONK mint

  let rpc = createHelius({ apiKey });
  try {
    const assetSlim = await rpc.getAssetProof({ id: assetId });
    console.log("Asset from RPC:", assetSlim);
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();