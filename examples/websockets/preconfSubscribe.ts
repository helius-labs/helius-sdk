import { getSignatureFromTransaction } from "@solana/kit";
import {
  makePreconfWsClientForApiKey,
  PreconfSlotStatus,
} from "helius-sdk/websockets/preconfWs";

/**
 * Subscribe to Helius **Pre Confirmations** (`preconfSubscribe`).
 *
 * Pre Confirmations are the lowest-latency transaction stream: scheduled
 * transactions are delivered *before* they are shredded. A pre-confirmation is
 * an **early signal, not a guarantee** — a streamed transaction may still fail
 * to land. Each open subscription is billed per message with a per-slot
 * minimum (https://www.helius.dev/docs/pre-confirmations/overview#pricing),
 * so filter server-side and unsubscribe when you're done.
 *
 * Served from the Gatekeeper endpoint (`wss://beta.helius-rpc.com`). Despite the
 * `beta` host name this is not a beta product — it is where Pre Confirmations
 * launch during the Gatekeeper migration.
 */
(async () => {
  const apiKey = ""; // From Helius dashboard

  const client = makePreconfWsClientForApiKey(apiKey);

  // Run both at once: the coverage call shouldn't delay the stream.
  // Filtered server-side: you only receive what matches, though the per-slot
  // minimum still applies. Omit the filter to stream every transaction from
  // Helius and BAM.
  const [coverage, sub] = await Promise.all([
    client.getPreConfCoverage(),
    client.preconfSubscribe(
      {
        includeSource: ["helius"], // Helius preconfirmations only (they carry a status)
        failed: false, // Successful transactions only
        accountInclude: ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"],
      },
      { slots: true } // Also deliver slot events; omit for transactions only
    ),
  ]);
  console.log(
    `Coverage: ${coverage.networkSharePercent}% of stake`,
    coverage.coverageByRegion
  );
  console.log("Subscription ID:", sub.subscriptionId);

  const timer = setTimeout(async () => {
    await sub.unsubscribe();
    client.close();
  }, 30_000);

  try {
    let count = 0;
    for await (const event of sub) {
      if (event.type === "slot") {
        // Leader-bank lifecycle: BankCreated when the slot starts, BankFrozen
        // when it ends. No ordering guarantee relative to the transactions of
        // its slot: some may still follow BankFrozen.
        const phase =
          event.status === PreconfSlotStatus.BankCreated
            ? "bank created"
            : "bank frozen";
        console.log(`slot ${event.slot} ${phase}`);
        continue;
      }
      // event: { type, version, slot, transactionIndex, status, transaction, transactionBytes }
      console.log(
        `preconf v${event.version} slot=${event.slot} index=${event.transactionIndex} status=${event.status}`,
        `sig=${getSignatureFromTransaction(event.transaction)}`,
        `(${event.transactionBytes.length} raw bytes)`
      );
      if (++count >= 10) break;
    }
  } finally {
    clearTimeout(timer);
    await sub.unsubscribe();
    client.close();
  }
})();
