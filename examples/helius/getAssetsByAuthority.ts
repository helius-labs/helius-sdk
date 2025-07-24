// Replace imports in a production setting
import { createHelius } from "../../src/rpc/index";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const authorityAddress = "2RtGg6fsFiiF1EQzHqbd66AhW7R5bWeQGpTbv2UMkCdW";

  let rpc = createHelius({ apiKey });
  try {
    const assetSlim = await rpc.getAssetsByAuthority({ authorityAddress: authorityAddress });
    console.log("Asset from RPC:", assetSlim);
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();