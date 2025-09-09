import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const creatorAddress = "D3XrkNZz6wx6cofot7Zohsf2KSsu2ArngNk8VqU9cTY3";

  const helius = createHelius({ apiKey });
  
  try {
    const asset = await helius.getAssetsByCreator({ creatorAddress: creatorAddress });
    console.log("Asset from RPC: ", asset);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();