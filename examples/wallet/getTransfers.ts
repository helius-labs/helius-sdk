import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    // Replace with the wallet address you want to check
    const walletAddress = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";

    console.log(`\nFetching transfer activity for: ${walletAddress}`);
    console.log("=".repeat(80));

    // Get first page of transfers
    const transfers = await helius.wallet.getTransfers({
      wallet: walletAddress,
      limit: 20, // Get 20 most recent transfers
    });

    console.log(`\nFound ${transfers.data.length} transfers\n`);

    // Separate incoming and outgoing transfers for better readability
    const incoming = transfers.data.filter((t) => t.direction === "in");
    const outgoing = transfers.data.filter((t) => t.direction === "out");

    console.log(`Incoming Transfers: ${incoming.length}`);
    console.log(`Outgoing Transfers: ${outgoing.length}\n`);

    transfers.data.forEach((transfer, index) => {
      const date = new Date(transfer.timestamp * 1000).toLocaleString();
      const direction = transfer.direction === "in" ? "Received" : "Sent";
      const symbol = transfer.symbol || "Unknown";
      const amount = transfer.amount.toFixed(transfer.decimals < 6 ? 4 : 2);

      console.log(`${index + 1}. ${direction} ${amount} ${symbol}`);
      console.log(`   Date: ${date}`);
      console.log(
        `   ${transfer.direction === "in" ? "From" : "To"}: ${transfer.counterparty}`
      );
      console.log(`   Signature: ${transfer.signature}`);
      console.log(
        `   Raw Amount: ${transfer.amountRaw} (${transfer.decimals} decimals)`
      );
      console.log("");
    });

    // Show pagination info
    console.log("\nPagination:");
    console.log(`   Has More: ${transfers.pagination.hasMore}`);
    if (transfers.pagination.nextCursor) {
      console.log(`   Next Cursor: ${transfers.pagination.nextCursor}`);
    }

    // Fetch next page if available
    if (transfers.pagination.hasMore && transfers.pagination.nextCursor) {
      console.log("\nFetching older transfers...");
      const olderTransfers = await helius.wallet.getTransfers({
        wallet: walletAddress,
        cursor: transfers.pagination.nextCursor,
        limit: 20,
      });
      console.log(`   Found ${olderTransfers.data.length} more transfers`);
    }
  } catch (error: any) {
    console.error("\nError fetching transfers:", error.message);
  }
})();
