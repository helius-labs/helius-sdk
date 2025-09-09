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

    const { value } = await helius.zk.getMultipleNewAddressProofs(hashes);

    console.table(
      value.map((p) => ({
        address: p.address,
        canCreate: p.proof.length === 0,
        nextIndex: p.nextIndex,
      }))
    );
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
