import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const slot = await helius.zk.getIndexerSlot();
    console.log(`Compression indexer is caught up to slot ${slot}`);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
