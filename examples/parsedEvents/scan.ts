// Replace imports in a production setting
import { createHelius } from "../../src/rpc/index";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  const PUMP_FUN = "6EF8rrecthR5Dkzon8Nwu78hRvfCKubJ14M5uBEwF6P";
  // Fix the window once, so it doesn't move between pages of the scan
  const oneHourAgo = Math.floor(Date.now() / 1000) - 60 * 60;

  try {
    let paginationToken: string | null | undefined;
    let requests = 0;
    let credits = 0;

    // Pump.fun buys and sells from the last hour. Each request costs 10
    // credits plus 1 per history page scanned (a page is up to 1,000
    // transactions), so cap the request count when scanning a busy address.
    do {
      const page = await helius.parsedEvents.scan({
        address: PUMP_FUN,
        match: {
          program: { programId: PUMP_FUN, instructions: ["buy", "sell"] },
        },
        time: { gte: oneHourAgo },
        limit: 100,
        paginationToken,
      });

      for (const result of page.data) {
        if (result.parserStatus === "OK") {
          console.log(result.signature, result.parsed.summary?.description);
        }
      }

      const { stoppedOn, scannedTransactions, matchedTransactions } = page.scan;
      console.log(
        `Stopped on ${stoppedOn}: scanned ${scannedTransactions}, matched ${matchedTransactions}`
      );

      credits += page.scan.creditsCharged;
      requests++;
      // Keep going while a token is returned, even if this page had no matches
      paginationToken = page.paginationToken;
    } while (paginationToken && requests < 5);

    console.log(`${requests} requests, ${credits} credits`);
  } catch (error) {
    console.error("Error:", error);
  }
})();
