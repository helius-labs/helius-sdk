import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    // Example: Check identities of known exchange wallets and SNS domains
    const identities = await helius.wallet.getBatchIdentity({
      addresses: [
        "HXsKP7wrBWaQ8T2Vtjry3Nj3oUgwYcqq9vrHDM12G664", // Binance 1
        "2ojv9BAiHUrvsm9gxDe7fJSzbNZSJcxZvf8dqmWGHG8S", // Coinbase 2
        "GJRs4FwHtemZ5ZE9x3FNvJ8TMwitKTh21yxdRPqn7npE", // Another known wallet
        "toly.sol", // SNS domain, resolved to its owner
        "nonexistent-xyz.sol", // Domain that doesn't resolve
      ],
    });

    console.log("\nBatch Identity Lookup Results:");
    console.log("=".repeat(80));
    console.log(`Got ${identities.length} entries\n`);

    identities.forEach((identity, index) => {
      // Domains that can't be resolved come back with no name, category or tags
      if (identity.unresolved) {
        console.log(`${index + 1}. ${identity.inputDomain} (unresolved)`);
        console.log("");
        return;
      }

      console.log(`${index + 1}. ${identity.name}`);
      if (identity.inputDomain) {
        console.log(`   Domain: ${identity.inputDomain}`);
      }
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
