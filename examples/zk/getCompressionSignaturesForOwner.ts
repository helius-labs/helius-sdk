// Replace imports in a production setting
import { createHelius } from "../../src/rpc";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    const sigs = await helius.zk.getCompressionSignaturesForOwner({
      owner: "ARDPkhymCbfdan375FCgPnBJQvUfHeb7nHVdBfwWSxrp",
      limit: 20,
    });

    console.log("Latest owner-related compression sigs:", sigs.value.items);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
