import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const sigs = await helius.zk.getLatestCompressionSignatures({ limit: 5 });
    console.log("Latest compression tx sigs:", sigs.value.items);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
