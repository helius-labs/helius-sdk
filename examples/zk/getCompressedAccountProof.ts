// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    const proof = await helius.zk.getCompressedAccountProof({
      hash: "CkcqmptQFTXMMZaKib6GwMNFffCEdbBDfyNttr33scA",
    });

    console.log(`Response: ${JSON.stringify(proof, null, 2)}`);
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();
