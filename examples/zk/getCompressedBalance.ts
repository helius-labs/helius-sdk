// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    const hash = "CkcqmptQFTXMMZaKib6GwMNFffCEdbBDfyNttr33scA";

    const balance = await helius.zk.getCompressedBalance({ hash });

    console.log(`Response: ${JSON.stringify(balance, null, 2)}`);
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();
