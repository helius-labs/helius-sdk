import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  // Replace with the wallet address you want to check
  const walletAddress = "5tzFkiKscXHK5ZXCGbXZxdw7gTjjD1mBwuoFbhUvuAi9";

  // USDC mint. For native SOL, use So11111111111111111111111111111111111111111
  const mint = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

  try {
    console.log(`\nHistorical balance for: ${walletAddress}`);
    console.log("=".repeat(80));

    // Provide exactly one of slot, time, or datetime.
    // Prefer `slot` for exact, deterministic results — block times can drift.
    const atSlot = await helius.wallet.getBalanceAt({
      wallet: walletAddress,
      mint,
      slot: 313000000,
    });

    console.log(`\nBy slot (${atSlot.requested.slot}):`);
    console.log(`  Balance: ${atSlot.balance} (raw: ${atSlot.balanceRaw})`);
    console.log(`  Decimals: ${atSlot.decimals}, isNative: ${atSlot.isNative}`);

    // `asOf` is the transaction the balance was read from.
    // It is null when the wallet held none of the token by that point.
    if (atSlot.asOf) {
      console.log(
        `  As of tx: ${atSlot.asOf.signature} (slot ${atSlot.asOf.slot})`
      );
    } else {
      console.log(
        "  No matching activity at or before this point — balance is 0"
      );
    }

    // Query by Unix timestamp (seconds) instead of slot
    const atTime = await helius.wallet.getBalanceAt({
      wallet: walletAddress,
      mint,
      time: 1736536800,
    });
    console.log(`\nBy time (${atTime.requested.time}): ${atTime.balance}`);

    // Query by datetime string (interpreted as UTC unless a timezone is given).
    // `requested.time` echoes the resolved epoch seconds.
    const atDatetime = await helius.wallet.getBalanceAt({
      wallet: walletAddress,
      mint,
      datetime: "2025-01-10 19:20:00",
    });
    const { datetime, time } = atDatetime.requested;
    console.log(
      `\nBy datetime (${datetime} -> ${time}): ${atDatetime.balance}`
    );
  } catch (error: any) {
    console.error("\nError fetching historical balance:", error.message);
  }
})();
