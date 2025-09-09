import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const mint = "3kiCsWXKaysbQzUrKvUHHepv8GhmrYUzcU5ZqMDdbbec";

    const res = await helius.zk.getCompressedMintTokenHolders({ mint });

    console.log("Slot :", res.context.slot);
    console.table(res.value.items);
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();
