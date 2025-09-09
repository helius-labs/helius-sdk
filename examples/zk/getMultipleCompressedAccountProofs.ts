import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const hashes = [
      "CkcqmptQFTXMMZaKib6GwMNFffCEdbBDfyNttr33scA",
      "3XxvVQReWUamhPTA7XLnzXebsuh4sBioxEy4aTgJwKte",
      "KexN4KsPq3uCtXngBDBn3SFCcFNXwb79DuzkmUs4efi",
    ];

    // Pass in as an array, not an object
    const { value } =
      await helius.zk.getMultipleCompressedAccountProofs(hashes);
    console.log(`Proofs received: ${JSON.stringify(value, null, 2)}`);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
