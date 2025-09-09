import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const owner = "3PrXqmhEcgPo2a5aTtCTYzgmuXRSx5imbUTDkz6SZMun";

    const res = await helius.zk.getCompressedBalanceByOwner({ owner });

    console.log("Slot: ", res.context.slot);
    console.log("Total lamports across all compressed accounts: ", res.value);
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();
