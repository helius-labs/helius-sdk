// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    const sigs = await helius.zk.getLatestCompressionSignatures({ limit: 5 });
    console.log("Latest compression tx sigs:", sigs.value.items);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
