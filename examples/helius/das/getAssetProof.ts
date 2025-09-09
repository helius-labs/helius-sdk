import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const assetId = "Bu1DEKeawy7txbnCEJE4BU3BKLXaNAKCYcHR4XhndGss";

  const helius = createHelius({ apiKey });

  try {
    const asset = await helius.getAssetProof({ id: assetId });
    console.log("Asset from RPC: ", asset);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();