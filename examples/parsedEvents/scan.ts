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
          programs: [{ programId: PUMP_FUN, instructions: ["buy", "sell"] }],
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

    // Only count the matches: no parsing, and `limit` doesn't apply, so each
    // request covers up to its budget (10,000 transactions by default). Sum
    // across pages for the whole window.
    let matches = 0;
    let scanned = 0;
    requests = 0;
    credits = 0;
    do {
      const { scan, paginationToken: next } = await helius.parsedEvents.scan({
        address: PUMP_FUN,
        match: {
          programs: [{ programId: PUMP_FUN, instructions: ["buy", "sell"] }],
        },
        time: { gte: oneHourAgo },
        returnShape: "count",
        paginationToken,
      });
      matches += scan.matchedTransactions;
      scanned += scan.scannedTransactions;
      credits += scan.creditsCharged;
      requests++;
      paginationToken = next;
    } while (paginationToken && requests < 5);

    console.log(
      `${matches} matches in ${scanned} transactions over ${requests} requests, ${credits} credits` +
        (paginationToken ? " (window not finished: raise the request cap)" : "")
    );
  } catch (error) {
    console.error("Error:", error);
  }
})();
