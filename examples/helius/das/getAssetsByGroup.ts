import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const assets = await helius.getAssetsByGroup({ groupKey: "collection", groupValue: "J1S9H3QjnRtBbbuD4HjPV6RpRhwuk4zKbxsnCHuTgh9w" });
    console.log("Fetched assets: ", assets);
  } catch (error) {
    console.error("Error: ", error);
  }
})();