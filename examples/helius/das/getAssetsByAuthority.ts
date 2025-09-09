import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const authorityAddress = "2RtGg6fsFiiF1EQzHqbd66AhW7R5bWeQGpTbv2UMkCdW";

  const helius = createHelius({ apiKey });
  
  try {
    const asset = await helius.getAssetsByAuthority({ authorityAddress: authorityAddress });
    console.log("Asset from RPC: ", asset);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();