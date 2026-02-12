import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    // Example: Check identities of multiple known exchange wallets
    const identities = await helius.wallet.getBatchIdentity({
      addresses: [
        "HXsKP7wrBWaQ8T2Vtjry3Nj3oUgwYcqq9vrHDM12G664", // Binance 1
        "2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S", // Coinbase 2
        "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE", // Another known wallet
      ],
    });

    console.log("\nBatch Identity Lookup Results:");
    console.log("=".repeat(80));
    console.log(`Found ${identities.length} identities\n`);

    identities.forEach((identity, index) => {
      console.log(`${index + 1}. ${identity.name}`);
      console.log(`   Address: ${identity.address}`);
      console.log(`   Type: ${identity.type}`);
      console.log(`   Category: ${identity.category}`);
      console.log(`   Tags: ${identity.tags.join(", ")}`);
      console.log("");
    });

    if (identities.length === 0) {
      console.log("No identities found for the provided addresses");
      console.log("These wallets are not known entities");
    }
  } catch (error: any) {
    console.error("\nError fetching batch identities:", error.message);
  }
})();
