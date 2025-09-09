import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });
  
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
