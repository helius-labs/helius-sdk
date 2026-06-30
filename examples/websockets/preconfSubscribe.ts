import { makePreconfWsClientForApiKey } from "helius-sdk/websockets/preconfWs";

/**
 * Subscribe to Helius **Pre Confirmations** (`preconfSubscribe`).
 *
 * Pre Confirmations are the lowest-latency transaction stream: scheduled
 * transactions are delivered *before* they are shredded. A pre-confirmation is
 * an **early signal, not a guarantee** — a streamed transaction may still fail
 * to land. Pricing is credit-based (billed per notification), not tip-based.
 *
 * Served from the Gatekeeper endpoint (`wss://beta.helius-rpc.com`). Despite the
 * `beta` host name this is not a beta product — it is where Pre Confirmations
 * launch during the Gatekeeper migration.
 */
(async () => {
  const apiKey = ""; // From Helius dashboard

  const client = makePreconfWsClientForApiKey(apiKey);

  // preconfSubscribe takes NO filters — it streams ALL scheduled transactions.
  const sub = await client.preconfSubscribe();
  console.log("Subscription ID:", sub.subscriptionId);

  const timer = setTimeout(async () => {
    await sub.unsubscribe();
    client.close();
  }, 30_000);

  try {
    let count = 0;
    for await (const event of sub) {
      // event: { version, slot, transactionIndex, status, transaction, transactionBytes }
      console.log(
        `preconf v${event.version} slot=${event.slot} index=${event.transactionIndex} status=${event.status}`,
        `sig=${Object.keys(event.transaction.signatures)[0]}`,
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
