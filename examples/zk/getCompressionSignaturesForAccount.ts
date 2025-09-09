import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const sigs = await helius.zk.getCompressionSignaturesForAccount({
      hash: "CkcqmptQFTXMMZaKib6GwMNFffCEdbBDfyNttr33scA",
    });

    console.table(sigs.value.items);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
