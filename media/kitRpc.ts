import { address, fetchEncodedAccount } from "@solana/kit";
import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  const wsol = address("So11111111111111111111111111111111111111112");

  try {
    // helius.kitRpc is the standard @solana/kit Rpc: methods return a pending
    // request, so call .send()
    const slot = await helius.kitRpc.getSlot().send();
    console.log("Slot: ", slot);

    // Pass helius.kitRpc to kit helpers and libraries that expect an Rpc.
    // Don't pass helius or helius.raw: they send each request immediately, so
    // the helper's request goes out and then the helper fails on .send()
    const account = await fetchEncodedAccount(helius.kitRpc, wsol);
    if (account.exists) {
      console.log("Owner: ", account.programAddress);
      console.log("Lamports: ", account.lamports);
      console.log("Data length: ", account.data.length);
    }
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
