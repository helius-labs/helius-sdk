import { makePreconfWsClient } from "helius-sdk/websockets/preconfWs";

/**
 * Subscribe to Helius **Pre Confirmations** (`preconfSubscribe`).
 *
 * Pre Confirmations are the lowest-latency transaction stream: scheduled
 * transactions are delivered *before* they are shredded. A pre-confirmation is
 * an **early signal, not a guarantee** — a streamed transaction may still fail
 * to land. Pricing is credit-based (billed per notification), not tip-based.
 *
 * NOTE: the public Pre Confirmations hostname was not yet wired into the public
 * router when this example was written. Confirm the canonical endpoint before
 * relying on a specific host.
 */
(async () => {
  const apiKey = ""; // From Helius dashboard
  const url = `wss://preconf-mainnet.helius-rpc.com/?api-key=${apiKey}`;

  const client = makePreconfWsClient(url);

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
      // event: { version, slot, transactionIndex, transaction, transactionBytes }
      console.log(
        `preconf v${event.version} slot=${event.slot} index=${event.transactionIndex}`,
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
