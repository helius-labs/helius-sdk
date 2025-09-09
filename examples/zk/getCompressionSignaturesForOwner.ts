import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

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
