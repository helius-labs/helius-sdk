// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    const owner = "3PrXqmhEcgPo2a5aTtCTYzgmuXRSx5imbUTDkz6SZMun";

    const res = await helius.zk.getCompressedAccountsByOwner({
      owner,
      limit: 3,
    });

    console.log(`Response: ${JSON.stringify(res, null, 2)}`);
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();
