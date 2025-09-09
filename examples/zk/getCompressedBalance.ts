import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });
  
  try {
    const hash = "CkcqmptQFTXMMZaKib6GwMNFffCEdbBDfyNttr33scA";

    const balance = await helius.zk.getCompressedBalance({ hash });

    console.log(`Response: ${JSON.stringify(balance, null, 2)}`);
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();
