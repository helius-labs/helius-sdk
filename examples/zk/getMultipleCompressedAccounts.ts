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

    const { value } = await helius.zk.getMultipleCompressedAccounts({ hashes });
    for (const acct of value.items) {
      console.log(acct?.hash, "→ lamports:", acct?.lamports ?? "N/A");
    }
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
