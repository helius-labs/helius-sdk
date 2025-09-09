import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    await helius.zk.getIndexerHealth();
    console.log("Compression indexer is in perfect sync");
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
