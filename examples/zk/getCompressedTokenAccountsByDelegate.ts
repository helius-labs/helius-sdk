// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    const res = await helius.zk.getCompressedTokenAccountsByDelegate({
      delegate: "ARDPkhymCbfdan375FCgPnBJQvUfHeb7nHVdBfwWSxrp",
      limit: 10,
    });

    console.log("Slot: ", res.context.slot);
    console.table(
      res.value.items.map((i) => ({
        owner: i.tokenData.owner,
        mint: i.tokenData.mint,
        amt: i.tokenData.amount,
      }))
    );
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
