import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  const address = "Vote111111111111111111111111111111111111111";

  try {
    // Get recent transactions example
    console.log("\nExample 1: Get Recent Transactions");
    const result = await helius.getTransactionsForAddress([
      address,
      {
        limit: 5, // Get the 5 most recent transactions
      },
    ]);

    console.log(`Found ${result.data.length} transactions`);
    result.data.forEach((tx, i) => {
      console.log(`${i + 1}. Signature: ${tx.signature}`);
      console.log(`   Slot: ${tx.slot}, Status: ${tx.err ? "Failed" : "Success"}`);
    });

    if (result.paginationToken) {
      console.log(`\nPagination token: ${result.paginationToken}`);
    }

    // Fetch full transaction details
    console.log("\nExample 2: Get Full Transaction Details");
    const fullTxs = await helius.getTransactionsForAddress([
      address,
      {
        limit: 2,
        transactionDetails: "full", // Get complete transaction data
      },
    ]);

    console.log(`Found ${fullTxs.data.length} full transactions`);

    fullTxs.data.forEach((tx, i) => {
      console.log(`\n${i + 1}. Transaction at slot ${tx.slot}`);
      console.log(`   Block time: ${new Date((tx.blockTime ?? 0) * 1000).toISOString()}`);
      console.log(`   Transaction keys: ${Object.keys(tx.transaction ?? {}).join(", ")}`);
    });

    // Filter by slot range
    console.log("\nExample 3: Filter by Slot Range ");
    const slotFiltered = await helius.getTransactionsForAddress([
      address,
      {
        limit: 10,
        filters: {
          slot: {
            gte: 100000000, // Greater than or equal to slot 100M
            lt: 200000000,  // Less than slot 200M
          },
        },
      },
    ]);

    console.log(`Found ${slotFiltered.data.length} transactions in slot range`);
    slotFiltered.data.forEach((tx, i) => {
      console.log(`${i + 1}. Slot: ${tx.slot}, Signature: ${tx.signature.slice(0, 20)}...`);
    });

    // Filter by time range
    console.log("\nExample 4: Filter by Time Range");
    // Get transactions from the last 24 hours
    const oneDayAgo = Math.floor(Date.now() / 1000) - (24 * 60 * 60);

    const timeFiltered = await helius.getTransactionsForAddress([
      address,
      {
        limit: 10,
        filters: {
          blockTime: {
            gte: oneDayAgo, // Unix timestamp from 24 hours ago
          },
        },
      },
    ]);

    console.log(`Found ${timeFiltered.data.length} transactions in the last 24 hours`);

    timeFiltered.data.forEach((tx, i) => {
      const date = new Date(tx.blockTime * 1000);
      console.log(`${i + 1}. ${date.toLocaleString()} - ${tx.signature.slice(0, 20)}...`);
    });

    // Sort order example
    console.log("\nExample 5: Sort Transactions");
    // Get oldest transactions first
    const ascending = await helius.getTransactionsForAddress([
      address,
      {
        limit: 3,
        sortOrder: "asc", // Ascending order (i.e., oldest first)
      },
    ]);

    console.log("\nOldest 3 transactions (ascending):");
    ascending.data.forEach((tx, i) => {
      console.log(`${i + 1}. Slot: ${tx.slot}, Signature: ${tx.signature.slice(0, 20)}...`);
    });

    // Get newest transactions first (default)
    const descending = await helius.getTransactionsForAddress([
      address,
      {
        limit: 3,
        sortOrder: "desc", // Descending order (i.e., newest first)
      },
    ]);

    console.log("\nNewest 3 transactions (descending):");
    descending.data.forEach((tx, i) => {
      console.log(`${i + 1}. Slot: ${tx.slot}, Signature: ${tx.signature.slice(0, 20)}...`);
    });

    // Include token account transactions
    console.log("\nExample 6: Include Token Account Transactions");
    const withTokenAccounts = await helius.getTransactionsForAddress([
      address,
      {
        limit: 10,
        filters: {
          includeTokenAccounts: true, // Include transactions from associated token accounts
          blockTime: {
            gte: Math.floor(Date.now() / 1000) - (7 * 24 * 60 * 60), // Last 7 days
          },
        },
      },
    ]);

    console.log(`Found ${withTokenAccounts.data.length} transactions (including token accounts)`);
    withTokenAccounts.data.forEach((tx, i) => {
      console.log(`${i + 1}. Slot: ${tx.slot}, Signature: ${tx.signature.slice(0, 20)}...`);
    });

    // Pagination with paginationToken
    console.log("\nExample 7: Pagination");
    // First page
    const page1 = await helius.getTransactionsForAddress([
      address,
      {
        limit: 5,
      },
    ]);

    console.log(`Page 1: ${page1.data.length} transactions`);
    page1.data.forEach((tx, i) => {
      console.log(`  ${i + 1}. ${tx.signature.slice(0, 20)}... (slot ${tx.slot})`);
    });

    // Second page using the paginationToken from page 1
    if (page1.paginationToken) {
      console.log(`\nPagination token from page 1: ${page1.paginationToken}`);

      const page2 = await helius.getTransactionsForAddress([
        address,
        {
          limit: 5,
          paginationToken: page1.paginationToken, // Use token from previous response
        },
      ]);

      console.log(`\nPage 2: ${page2.data.length} transactions`);
      page2.data.forEach((tx, i) => {
        console.log(`  ${i + 1}. ${tx.signature.slice(0, 20)}... (slot ${tx.slot})`);
      });
    }
  } catch (error) {
    console.error("Error running examples:", error);
  }
})();
