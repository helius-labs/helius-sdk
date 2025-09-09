import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const { value } = await helius.zk.getLatestNonVotingSignatures({
      limit: 5,
    });
    console.table(value.items);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
