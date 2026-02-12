import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    // Replace with the wallet address you want to check
    const walletAddress = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";

    console.log(`\n💰 Fetching balances for: ${walletAddress}`);
    console.log("=" .repeat(80));

    // Get first page of balances
    const balances = await helius.wallet.getBalances({
      wallet: walletAddress,
      showNative: true, // Include SOL
      showNfts: false, // Set to true to include NFTs
      page: 1,
      limit: 100,
    });

    console.log(`\nTotal USD Value (this page): $${balances.totalUsdValue.toFixed(2)}`);
    console.log(`\nToken Balances (${balances.balances.length} tokens):`);
    console.log("-".repeat(80));

    balances.balances.forEach((token, index) => {
      const symbol = token.symbol || "Unknown";
      const name = token.name || "Unknown Token";
      const balance = token.balance.toFixed(token.decimals < 6 ? 4 : 2);
      const usdValue = token.usdValue
        ? `$${token.usdValue.toFixed(2)}`
        : "No price data";

      console.log(`${index + 1}. ${symbol} - ${name}`);
      console.log(`   Balance: ${balance}`);
      console.log(`   USD Value: ${usdValue}`);
      console.log(`   Mint: ${token.mint}`);
      console.log("");
    });

    // Show pagination info
    console.log("\nPagination:");
    console.log(`   Current Page: ${balances.pagination.page}`);
    console.log(`   Limit: ${balances.pagination.limit}`);
    console.log(`   Has More: ${balances.pagination.hasMore}`);

    // Fetch next page if available
    if (balances.pagination.hasMore) {
      console.log("\nFetching page 2...");
      const page2 = await helius.wallet.getBalances({
        wallet: walletAddress,
        page: 2,
      });
      console.log(`   Found ${page2.balances.length} more tokens on page 2`);
      console.log(
        `   Total USD Value (page 2): $${page2.totalUsdValue.toFixed(2)}`
      );
    }
  } catch (error: any) {
    console.error("\nError fetching balances:", error.message);
  }
})();
