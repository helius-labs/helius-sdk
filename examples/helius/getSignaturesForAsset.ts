// Replace imports in a production setting
import { createHelius } from "../../src/rpc/index";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const assets = await helius.getSignaturesForAsset({ id: "FNt6A9Mfnqbwc1tY7uwAguKQ1JcpBrxmhczDgbdJy5AC" });
    console.log("Fetched assets:", assets);
  } catch (error) {
    console.error("Error:", error);
  }
})();