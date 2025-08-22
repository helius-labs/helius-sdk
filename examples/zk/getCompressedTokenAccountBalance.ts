// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    const accountHash = "2og5JCWe5dn2vspbCJZEKNJNhbQDecobFrHwHEq4vm3B";

    const balance = await helius.zk.getCompressedTokenAccountBalance({
      hash: accountHash,
    });

    console.log("Slot: ", balance.context.slot);
    console.log("Balance: ", balance.value.amount);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
