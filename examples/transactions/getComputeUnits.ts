// Replace imports in a production setting
import { createHelius } from "../../src/rpc/index";
import {
  address,
  createTransactionMessage,
  pipe,
  setTransactionMessageFeePayer,
  setTransactionMessageLifetimeUsingBlockhash,
} from "@solana/kit";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const feePayer = address("your_address_here");

    const { value: latestBlockhash } = await helius.getLatestBlockhash();

    const message = pipe(
      createTransactionMessage({ version: 0 }),
      (m) => setTransactionMessageFeePayer(feePayer, m),
      (m) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, m)
    );

    const cus = await helius.tx.getComputeUnits(message);
    console.log("Estimated compute units:", cus);
  } catch (error) {
    console.error("Error:", error);
  }
})();
