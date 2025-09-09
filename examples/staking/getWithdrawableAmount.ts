import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    // Replace with actual address
    const WALLET = "";
    const stakeAccounts = await helius.stake.getHeliusStakeAccounts(WALLET);

    console.log("\n— Helius-delegated stake accounts —");
    if (!stakeAccounts.length) {
      console.log("None found");
      return;
    }

    for (const [i, acc] of stakeAccounts.entries()) {
      const pubkey = acc.pubkey.toString();
      const withdrawable = await helius.stake.getWithdrawableAmount(pubkey);
      const withdrawableFull = await helius.stake.getWithdrawableAmount(
        pubkey,
        true
      );

      console.log(
        `${i + 1}. ${pubkey}\n    withdrawable (ex-rent): ${withdrawable} lamports\n` +
          `    withdrawable (incl rent): ${withdrawableFull} lamports`
      );
    }
  } catch (error) {
    console.error("Error: ", error);
  }
})();
