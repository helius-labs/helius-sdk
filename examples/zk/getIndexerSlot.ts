// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    const slot = await helius.zk.getIndexerSlot();
    console.log(`Compression indexer is caught up to slot ${slot}`);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
