// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    const sigs = await helius.zk.getCompressionSignaturesForAddress({
      address: "CkcqmptQFTXMMZaKib6GwMNFffCEdbBDfyNttr33scA",
    });

    console.table(sigs.value.items);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
