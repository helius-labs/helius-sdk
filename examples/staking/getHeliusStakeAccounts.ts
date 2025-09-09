import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    // Replace with actual address
    const WALLET = "";
    const stakeAccounts = await helius.stake.getHeliusStakeAccounts(WALLET);

    console.log("\n— Helius-delegated stake accounts —");
    stakeAccounts.forEach((acc: any, i: number) => {
      console.log(`${i + 1}. ${acc.pubkey}`);
    });

    if (!stakeAccounts.length) {
      console.log("No stake accounts found. Nothing else to test");
    }
  } catch (error) {
    console.error("Error: ", error);
  }
})();
