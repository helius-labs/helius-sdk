import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const estimate = await helius.getPriorityFeeEstimate({
      accountKeys: ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"],
      options: { includeAllPriorityFeeLevels: true },
    });
    
    console.log("Priority fee estimate: ", estimate);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
