// Replace imports in a production setting
import { createHelius } from "../../src/rpc/index";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const creatorAddress = "D3XrkNZz6wx6cofot7Zohsf2KSsu2ArngNk8VqU9cTY3";

  let rpc = createHelius({ apiKey });
  try {
    const assetSlim = await rpc.getAssetsByCreator({ creatorAddress: creatorAddress });
    console.log("Asset from RPC:", assetSlim);
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();