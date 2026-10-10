import { makeParsedStreamsClient } from "helius-sdk/websockets/parsedStreams";

/**
 * Stream decoded Jupiter swaps with Helius **Parsed Streams**.
 *
 * Flow: `describeProgram` to get the exact instruction names, build a filter
 * with them, then subscribe. The client reconnects and resubscribes on its own
 * when the server closes the connection (idle after 10 minutes without a
 * match, deploys, network edge), and `onReconnect` reports the last slot it
 * delivered so you can backfill the gap from RPC. 1 credit per delivered event.
 *
 * On Node 20, pass `WebSocket` from the `ws` package:
 * `makeParsedStreamsClient(apiKey, { WebSocket })`.
 */
(async () => {
  const apiKey = ""; // From Helius dashboard
  const JUPITER = "JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4";

  const streams = makeParsedStreamsClient(apiKey, {
    onReconnect: ({ closeCode, lastSlot }) =>
      console.warn(
        `Reconnected after close ${closeCode}; transactions after slot ${lastSlot} may have been missed`
      ),
  });

  // Check the names against the catalog first: a guessed name is valid but
  // matches nothing
  const instructionNames = ["route", "shared_accounts_route"];
  const jupiter = await streams.describeProgram(JUPITER);
  const unknown = instructionNames.filter(
    (name) => !jupiter.instructions.includes(name)
  );
  if (unknown.length) {
    throw new Error(`Not in ${jupiter.name}'s catalog: ${unknown.join(", ")}`);
  }

  const sub = await streams.parsedTransactionSubscribe(
    {
      programs: [JUPITER],
      instructionNames,
      includeCpi: false, // Only instructions the user signed for
    },
    { details: "full" }
  );

  let count = 0;
  try {
    for await (const { context, value } of sub) {
      for (const i of value.matchedIndexes ?? []) {
        const ix = value.instructions[i];
        console.log(
          `slot ${context.slot} ${value.transaction.signature}`,
          ix.instructionName,
          ix.summary?.description ?? ix.decoded?.args
        );
      }
      if (++count >= 10) break; // Leaving the loop unsubscribes
    }
  } finally {
    streams.close();
  }
})();
