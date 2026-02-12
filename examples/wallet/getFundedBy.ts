import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    // Replace with the wallet address you want to check
    const walletAddress = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";

    console.log(`\nFinding funding source for: ${walletAddress}`);
    console.log("=".repeat(80));

    const fundingInfo = await helius.wallet.getFundedBy({
      wallet: walletAddress,
    });

    console.log("\nOriginal Funding Information:");
    console.log("=".repeat(80));
    console.log(`\nFunder Address: ${fundingInfo.funder}`);

    if (fundingInfo.funderName) {
      console.log(`Funder Name: ${fundingInfo.funderName}`);
      console.log(`Funder Type: ${fundingInfo.funderType}`);
      console.log(
        "\nThis wallet was funded by a known entity (exchange, protocol, etc.)"
      );
    } else {
      console.log("\nFunder is not a known entity (private wallet)");
    }

    console.log(`\nFunding Details:`);
    console.log(`   Token: ${fundingInfo.symbol}`);
    console.log(`   Amount: ${fundingInfo.amount} ${fundingInfo.symbol}`);
    console.log(`   Raw Amount: ${fundingInfo.amountRaw}`);
    console.log(`   Decimals: ${fundingInfo.decimals}`);

    console.log(`\nTransaction Info:`);
    console.log(`   Date: ${fundingInfo.date}`);
    console.log(
      `   Timestamp: ${fundingInfo.timestamp} (${new Date(fundingInfo.timestamp * 1000).toLocaleString()})`
    );
    console.log(`   Slot: ${fundingInfo.slot}`);
    console.log(`   Signature: ${fundingInfo.signature}`);

    console.log(`\nExplorer Link:`);
    console.log(`   ${fundingInfo.explorerUrl}`);
  } catch (error: any) {
    if (error.message.includes("404")) {
      console.log("\nNo funding transaction found");
      console.log(
        "This wallet may have been funded before indexing started, or never received SOL"
      );
    } else {
      console.error("\nError fetching funding information:", error.message);
    }
  }
})();
