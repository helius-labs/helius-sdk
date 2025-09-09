import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard

  let helius = createHelius({ apiKey });
  try {
    const { value: blockhash } = await helius.getLatestBlockhash();
    console.log("Blockhash: ", blockhash);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
