import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  const programId = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

  try {
    // === Example 1: Basic fetch ===
    console.log("\n=== Example 1: Basic fetch ===");
    const firstPage = await helius.getProgramAccountsV2([
      programId,
      { encoding: "jsonParsed", limit: 5 },
    ]);
    console.log("Fetched", firstPage.accounts.length, "accounts");
    console.log("First account:", firstPage.accounts[0]?.pubkey);

    // === Example 2: Continue pagination ===
    if (firstPage.paginationKey) {
      console.log("\n=== Example 2: Next page with paginationKey ===");
      const secondPage = await helius.getProgramAccountsV2([
        programId,
        {
          encoding: "jsonParsed",
          limit: 5,
          paginationKey: firstPage.paginationKey,
        },
      ]);
      console.log("Fetched", secondPage.accounts.length, "more accounts");
    }

    // === Example 3: Filter by account size (165 bytes = token accounts) ===
    console.log("\n=== Example 3: Filter by account size ===");
    const tokenAccounts = await helius.getProgramAccountsV2([
      programId,
      { encoding: "jsonParsed", limit: 5, filters: [{ dataSize: 165 }] },
    ]);
    tokenAccounts.accounts.forEach((a) => {
      const parsed = a.account.data?.parsed;
      console.log(`Token account: ${a.pubkey}, mint: ${parsed?.info?.mint}`);
    });

    // === Example 4: Memcmp filter (specific owner) ===
    console.log("\n=== Example 4: Memcmp filter ===");
    const owner = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";
    const ownedAccounts = await helius.getProgramAccountsV2([
      programId,
      {
        encoding: "base64",
        limit: 3,
        filters: [
          { dataSize: 165 },
          { memcmp: { offset: 32, bytes: owner } },
        ],
      },
    ]);
    console.log("Found", ownedAccounts.accounts.length, "accounts for owner");

    // === Example 5: Incremental updates (changedSinceSlot) ===
    console.log("\n=== Example 5: Incremental updates ===");
    const recentSlot = 363340000; // replace with a recent slot
    const changed = await helius.getProgramAccountsV2([
      programId,
      { encoding: "base64", limit: 5, changedSinceSlot: recentSlot },
    ]);
    console.log("Changed accounts since", recentSlot, ":", changed.accounts.length);

    // === Example 6: Auto-pagination (loop until no paginationKey) ===
    console.log("\n=== Example 6: Auto-pagination ===");
    let paginationKey: string | null = null;
    let allAccounts: any[] = [];
    do {
      const page = await helius.getProgramAccountsV2([
        programId,
        {
          encoding: "base64",
          limit: 1000,
          ...(paginationKey ? { paginationKey } : {}),
          filters: [{ dataSize: 165 }],
        },
      ]);
      allAccounts.push(...page.accounts);
      paginationKey = page.paginationKey;
    } while (paginationKey);
    console.log("Fetched total accounts:", allAccounts.length);
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();