// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    const { value } = await helius.zk.getLatestNonVotingSignatures({
      limit: 5,
    });
    console.table(value.items);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
