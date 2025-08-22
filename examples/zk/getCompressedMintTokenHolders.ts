// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    const mint = "3kiCsWXKaysbQzUrKvUHHepv8GhmrYUzcU5ZqMDdbbec";

    const res = await helius.zk.getCompressedMintTokenHolders({ mint });

    console.log("Slot :", res.context.slot);
    console.table(res.value.items);
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();
