import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  const ownerAddress = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";

  try {
// === Example 1: Get SPL token accounts (first page) ===
  console.log("\n=== Example 1: Get SPL token accounts ===");

  const firstPage = await helius.getTokenAccountsByOwnerV2([

    ownerAddress,
    { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
    { encoding: "jsonParsed", limit: 10 },
  ]);

  console.log(`Found ${firstPage.accounts.length} token accounts`);

  firstPage.accounts.forEach((account) => {
    const parsed = account.account.data?.parsed;

    if (parsed?.info) {
      const tokenAmount = parsed.info.tokenAmount;

      console.log(`Account ${account.pubkey.slice(0, 8)}...`);
      console.log(`Mint: ${parsed.info.mint}`);
      console.log(`Balance: ${tokenAmount?.uiAmountString ?? "0"}`);
    }
  });

  // === Example 2: Continue pagination if needed ===
  if (firstPage.paginationKey) {
    console.log("\n=== Example 2: Fetching next page ===");

    const secondPage = await helius.getTokenAccountsByOwnerV2([
      ownerAddress,
      { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
      { encoding: "jsonParsed", limit: 10, paginationKey: firstPage.paginationKey },
    ]);

    console.log(`Fetched ${secondPage.accounts.length} more accounts`);
  }

   // === Example 3: Get accounts for a specific mint (e.g., USDC) ===
  console.log("\n=== Example 3: Get accounts for specific mint ===");

  const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const usdcAccounts = await helius.getTokenAccountsByOwnerV2([
    ownerAddress,
    { mint: usdcMint },
    { encoding: "jsonParsed" },
  ]);

  if (usdcAccounts.accounts.length > 0) {
    console.log(`Found ${usdcAccounts.accounts.length} USDC account(s)`);

    const account = usdcAccounts.accounts[0];
    const parsed = account.account.data?.parsed;

    console.log(`USDC Balance: ${parsed?.info?.tokenAmount?.uiAmountString ?? "0"}`);
  } else {
    console.log("No USDC accounts found for this wallet");
  }

  // === Example 4: Token-2022 program ===
  console.log("\n=== Example 4: Get Token-2022 accounts ===");

  const token2022Accounts = await helius.getTokenAccountsByOwnerV2([
    ownerAddress,
    { programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb" },
    { encoding: "jsonParsed", limit: 5 },
  ]);

  console.log(`Found ${token2022Accounts.accounts.length} Token-2022 accounts`);

  // === Example 5: Recently changed accounts (incremental) ===
  console.log("\n=== Example 5: Recently changed accounts ===");

  const recentSlot = 363_340_000; // replace with a recent slot
  const changedAccounts = await helius.getTokenAccountsByOwnerV2([
    ownerAddress,
    { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
    { encoding: "jsonParsed", limit: 5, changedSinceSlot: recentSlot },
  ]);

  console.log(`Found ${changedAccounts.accounts.length} accounts changed since slot ${recentSlot}`);

  // === Example 6: Using base64 encoding ===
  console.log("\n=== Example 7: Using base64 encoding ===");

  const base64Accounts = await helius.getTokenAccountsByOwnerV2([
    ownerAddress,
    { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
    { encoding: "base64", limit: 2 },
  ]);

  console.log(`Fetched ${base64Accounts.accounts.length} accounts with base64 encoding`);

  base64Accounts.accounts.forEach((account) => {
    // base64 encoding returns [data, encoding]
    const arr = account.account.data as [string, string];
    console.log(`Account ${account.pubkey.slice(0, 8)}...`);
    console.log(`Data length: ${arr?.[0]?.length ?? 0} bytes`);
    console.log(`Encoding: ${arr?.[1]}`);
  });
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();