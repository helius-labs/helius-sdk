// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let rpc = createHelius({ apiKey });
  try {
    const estimate = await rpc.getPriorityFeeEstimate({
      accountKeys: ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"],
      options: { includeAllPriorityFeeLevels: true },
    });
    
    console.log("Priority fee estimate", estimate);
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();
