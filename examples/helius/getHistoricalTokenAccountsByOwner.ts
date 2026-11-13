import { createHelius } from "helius-sdk";
import type {
  GetHistoricalTokenAccountsByOwnerConfig,
  HistoricalAccountQuery,
  HistoricalKeyedAccount,
} from "helius-sdk/types/types";

// Beta, mainnet only. History starts at slot 444959999.

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  const owner = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";
  const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

  // A short or empty page can still have more behind it, so stop only when
  // paginationKey is null. Pin `slot` so every page reads the same state.
  const getAll = async (
    query: HistoricalAccountQuery,
    config: GetHistoricalTokenAccountsByOwnerConfig = {}
  ) => {
    const accounts: HistoricalKeyedAccount[] = [];
    let paginationKey: string | undefined;
    do {
      const { value } = await helius.getHistoricalTokenAccountsByOwner([
        owner,
        query,
        { ...config, paginationKey },
      ]);
      accounts.push(...value.accounts);
      paginationKey = value.paginationKey ?? undefined;
    } while (paginationKey);
    return accounts;
  };

  try {
    // === Example 1: A wallet's USDC balance at a past slot ===
    const usdc = await getAll(
      { slot: 445_000_000 },
      { mint: usdcMint, encoding: "jsonParsed" }
    );

    for (const { pubkey, account } of usdc) {
      if (!Array.isArray(account.data)) {
        const amount = account.data.parsed.info.tokenAmount.uiAmountString;
        console.log(`${pubkey}: ${amount} USDC`);
      }
    }

    // === Example 2: Every token account at a past slot ===
    const all = await getAll({ slot: 445_000_000 }, { encoding: "jsonParsed" });
    console.log(`Token accounts at slot 445000000: ${all.length}`);

    // === Example 3: One page of Token-2022 accounts right after a transaction ===
    const { value } = await helius.getHistoricalTokenAccountsByOwner([
      owner,
      { slot: 445_000_000, transactionIndex: 10 },
      { programId: "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb", limit: 100 },
    ]);

    for (const { pubkey, account } of value.accounts) {
      const [data, encoding] = account.data;
      console.log(`${pubkey}: ${data.length} ${encoding} chars`);
    }
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();
