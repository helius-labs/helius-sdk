// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    await helius.zk.getIndexerHealth();
    console.log("Compression indexer is in perfect sync");
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
