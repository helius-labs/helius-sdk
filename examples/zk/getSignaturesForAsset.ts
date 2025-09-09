import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const history = await helius.zk.getSignaturesForAsset({
      id: "FNt6A9Mfnqbwc1tY7uwAguKQ1JcpBrxmhczDgbdJy5AC",
      page: 1,
    });

    console.log(history.items);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
