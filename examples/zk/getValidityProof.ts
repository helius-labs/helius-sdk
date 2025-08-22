// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    const proof = await helius.zk.getValidityProof({
      hashes: ["12dAzsyUjd6riPCGCzrbHt1pupXiQD9UCetFiUesYzfn"],
    });

    console.log(`${JSON.stringify(proof, null, 2)}`);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
