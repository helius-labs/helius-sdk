// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    const account = await helius.zk.getCompressedAccount({
      address: null,
      hash: "CkcqmptQFTXMMZaKib6GwMNFffCEdbBDfyNttr33scA",
    });

    console.log(`Response: ${JSON.stringify(account, null, 2)}`);
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();
