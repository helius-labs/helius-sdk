import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard (Business+ plan required)
  const helius = createHelius({ apiKey });

  // Subscribe to transactions involving a specific account
  const sub = await helius.ws.transactionSubscribe(
    { accountInclude: ["EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"] },
    { commitment: "confirmed", encoding: "jsonParsed", transactionDetails: "full" }
  );

  console.log("Subscription ID:", sub.subscriptionId);

  const timer = setTimeout(async () => {
    await sub.unsubscribe();
    helius.ws.close();
  }, 30_000);

  try {
    for await (const notif of sub) {
      console.log("Transaction:", notif.signature, "Slot:", notif.slot);
    }
  } catch (e: any) {
    if (e?.name !== "AbortError") throw e;
  } finally {
    clearTimeout(timer);
  }
})();
