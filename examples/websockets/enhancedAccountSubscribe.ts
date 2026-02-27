import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard (Business+ plan required)
  const helius = createHelius({ apiKey });

  // Subscribe to account changes via Enhanced WebSockets
  const sub = await helius.ws.accountSubscribe(
    "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
    { encoding: "jsonParsed", commitment: "confirmed" }
  );

  console.log("Subscription ID:", sub.subscriptionId);

  const timer = setTimeout(async () => {
    await sub.unsubscribe();
    helius.ws.close();
  }, 30_000);

  try {
    for await (const notif of sub) {
      console.log("Slot:", notif.context.slot, "Lamports:", notif.value.lamports);
    }
  } catch (e: any) {
    if (e?.name !== "AbortError") throw e;
  } finally {
    clearTimeout(timer);
  }
})();
