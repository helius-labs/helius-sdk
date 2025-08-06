// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    const list = await helius.zk.getCompressedTokenAccountsByOwner({
      owner: "11111115q4EpJaTXAZWpCg3J2zppWGSZ46KXozzo9",
      limit: 50,
    });

    console.log(JSON.stringify(list.value.items, null, 2));
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
