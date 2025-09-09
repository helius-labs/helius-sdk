import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  const ac = new AbortController();
  const request = await helius.ws.logsNotifications("all", { commitment: "confirmed" });
  const stream = await request.subscribe({ abortSignal: ac.signal });

  const timer = setTimeout(() => ac.abort(), 5_000);
  let count = 0;
  try {
    for await (const notif of stream) {
      const v: any = (notif as any).value ?? notif;
      console.log("• logs#", ++count, (v.logs ?? []).slice(-2));
    }
  } catch (e: any) {
    if (e?.name !== "AbortError") throw e;
  } finally {
    clearTimeout(timer);
  }
})();