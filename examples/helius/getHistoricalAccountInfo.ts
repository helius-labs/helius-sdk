import { createHelius } from "helius-sdk";
import type { HistoricalAccount } from "helius-sdk/types/types";

// Beta, mainnet only. History starts at slot 444959999.

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  const usdcMint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
  const wallet = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";

  try {
    // === Example 1: An account at the end of a past slot ===
    const { value: mint } = await helius.getHistoricalAccountInfo([
      usdcMint,
      { slot: 445_000_000 },
      { encoding: "jsonParsed" },
    ]);

    if (!mint) {
      console.log("Account didn't exist at that slot");
    } else if (!Array.isArray(mint.data)) {
      console.log("USDC supply:", mint.data.parsed.info.supply);
      console.log("Last written at:", mint.lastUpdatedAt);
    }

    // === Example 2: Before and after a transaction ===
    // Slots after 444959999, so the "before" position is still covered
    const { data: txs } = await helius.getTransactionsForAddress([
      wallet,
      { limit: 1, filters: { slot: { gt: 444_959_999 } } },
    ]);

    if (txs[0]) {
      const { slot, transactionIndex } = txs[0];
      const [before, after] = await Promise.all([
        helius.getHistoricalAccountInfo([
          wallet,
          transactionIndex > 0
            ? { slot, transactionIndex: transactionIndex - 1 }
            : { slot: slot - 1 },
        ]),
        helius.getHistoricalAccountInfo([wallet, { slot, transactionIndex }]),
      ]);
      console.log(
        `Lamports: ${before.value?.lamports ?? 0} -> ${after.value?.lamports ?? 0}`
      );
    }

    // === Example 3: Walk back through an account's states, newest first ===
    // A write outside a transaction (transactionIndex null) steps to the
    // previous slot, skipping any transaction write earlier in that slot.
    const states: HistoricalAccount[] = [];
    let position: { slot: number; transactionIndex?: number } | undefined;

    while (states.length < 10) {
      const { value } = await helius.getHistoricalAccountInfo([
        usdcMint,
        position ?? {},
      ]);
      if (!value) break;

      states.push(value);
      const { slot, transactionIndex } = value.lastUpdatedAt;
      if (slot <= 444_959_999) break;

      position = transactionIndex
        ? { slot, transactionIndex: transactionIndex - 1 }
        : { slot: slot - 1 };
    }

    console.log(`Found ${states.length} states`);
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();
