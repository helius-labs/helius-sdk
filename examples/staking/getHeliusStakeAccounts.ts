import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

<<<<<<< Updated upstream
  try {
    // Replace with actual address
    const WALLET = "";
    const stakeAccounts = await helius.stake.getHeliusStakeAccounts(WALLET);
=======
  const wallet = new PublicKey('D8vy6wcSCoJx3WzbJCHdd2enYBe5eKXU8N5vTESkX1sk');
  console.log('Fetching Heliusdelegated stake accounts for: - getHeliusStakeAccounts.ts:8', wallet.toBase58());
>>>>>>> Stashed changes

    console.log("\n— Helius-delegated stake accounts —");
    stakeAccounts.forEach((acc: any, i: number) => {
      console.log(`${i + 1}. ${acc.pubkey}`);
    });

<<<<<<< Updated upstream
    if (!stakeAccounts.length) {
      console.log("No stake accounts found. Nothing else to test");
=======
  if (stakeAccounts.length === 0) {
    console.log('No stake accounts found delegated to Helius. - getHeliusStakeAccounts.ts:13');
    return;
  }

  for (const account of stakeAccounts) {
    const data = account.account.data;

    if (data && 'parsed' in data) {
      const info = data.parsed.info;
      const delegation = info.stake?.delegation;

      console.log('');
      console.log('Stake Pubkey: - getHeliusStakeAccounts.ts:25', account.pubkey.toBase58());
      console.log('Stake Amount: - getHeliusStakeAccounts.ts:26', delegation.stake / LAMPORTS_PER_SOL, 'SOL');
      console.log('Delegated to: - getHeliusStakeAccounts.ts:27', delegation.voter);
      console.log('Activation Epoch: - getHeliusStakeAccounts.ts:28', delegation.activationEpoch);
      console.log('Deactivation Epoch: - getHeliusStakeAccounts.ts:29', delegation.deactivationEpoch);
>>>>>>> Stashed changes
    }
  } catch (error) {
    console.error("Error: ", error);
  }
<<<<<<< Updated upstream
})();
=======
}

main().catch((err) => {
  console.error('Example failed: - getHeliusStakeAccounts.ts:35', err);
  process.exit(1);
});
>>>>>>> Stashed changes
