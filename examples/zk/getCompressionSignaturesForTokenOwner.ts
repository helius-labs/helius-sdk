// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    const sigs = await helius.zk.getCompressionSignaturesForTokenOwner({
      owner: "11111115q4EpJaTXAZWpCg3J2zppWGSZ46KXozzo9",
      limit: 20,
    });

    console.log("Latest owner-related compression sigs:", sigs.value.items);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
