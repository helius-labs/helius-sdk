import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    // Replace with the wallet address you want to check
    const walletAddress = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";

    console.log(`\nFetching transaction history for: ${walletAddress}`);
    console.log("=".repeat(80));

    // Get first page of transaction history
    const history = await helius.wallet.getHistory({
      wallet: walletAddress,
      limit: 10, // Get 10 most recent transactions
      tokenAccounts: "balanceChanged", // Include token account transactions that changed balances
    });

    console.log(`\nFound ${history.data.length} transactions\n`);

    history.data.forEach((tx, index) => {
      const date = tx.timestamp
        ? new Date(tx.timestamp * 1000).toLocaleString()
        : "Pending";
      const status = tx.error ? "Failed" : "Success";

      console.log(`${index + 1}. Transaction ${status}`);
      console.log(`   Signature: ${tx.signature}`);
      console.log(`   Date: ${date}`);
      console.log(`   Slot: ${tx.slot}`);
      console.log(`   Fee: ${tx.fee} SOL`);
      console.log(`   Fee Payer: ${tx.feePayer}`);

      if (tx.error) {
        console.log(`   Error: ${tx.error}`);
      }

      if (tx.balanceChanges.length > 0) {
        console.log(`   Balance Changes:`);
        tx.balanceChanges.forEach((change) => {
          const sign = change.amount > 0 ? "+" : "";
          console.log(
            `      ${sign}${change.amount} ${change.mint === "SOL" ? "SOL" : change.mint.slice(0, 8) + "..."}`
          );
        });
      }
      console.log("");
    });

    // Show pagination info
    console.log("\nPagination:");
    console.log(`   Has More: ${history.pagination.hasMore}`);
    if (history.pagination.nextCursor) {
      console.log(`   Next Cursor: ${history.pagination.nextCursor}`);
    }

    // Fetch next page if available
    if (history.pagination.hasMore && history.pagination.nextCursor) {
      console.log("\nFetching older transactions...");
      const olderTxs = await helius.wallet.getHistory({
        wallet: walletAddress,
        before: history.pagination.nextCursor,
        limit: 10,
      });
      console.log(`   Found ${olderTxs.data.length} more transactions`);
    }
  } catch (error: any) {
    console.error("\nError fetching history:", error.message);
  }
})();
