import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const balances = await helius.zk.getCompressedTokenBalancesByOwner({
      owner: "11111115q4EpJaTXAZWpCg3J2zppWGSZ46KXozzo9",
      limit: 50,
    });

    console.log(JSON.stringify(balances.value.token_balances, null, 2))
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
