// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    const history = await helius.zk.getSignaturesForAsset({
      id: "FNt6A9Mfnqbwc1tY7uwAguKQ1JcpBrxmhczDgbdJy5AC",
      page: 1,
    });

    console.log(history.items);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
