import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    // Example: Check identity of a known exchange wallet (Binance)
    const identity = await helius.wallet.getIdentity({
      wallet: "HXsKP7wrBWaQ8T2Vtjry3Nj3oUgwYcqq9vrHDM12G664",
    });

    console.log("\nWallet Identity Information:");
    console.log("=".repeat(80));
    console.log(`Address: ${identity.address}`);
    console.log(`Name: ${identity.name}`);
    console.log(`Type: ${identity.type}`);
    console.log(`Category: ${identity.category}`);
    console.log(`Tags: ${identity.tags.join(", ")}`);
  } catch (error: any) {
    if (error.message.includes("404")) {
      console.log("\nNo identity information found for this wallet");
      console.log("This wallet is not a known entity (exchange, protocol, etc.)");
    } else {
      console.error("\nError fetching wallet identity:", error.message);
    }
  }
})();
