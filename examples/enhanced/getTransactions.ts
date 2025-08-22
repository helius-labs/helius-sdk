// Replace imports in a production setting
import { createHelius } from "../../src/rpc/index";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const txns = await helius.enhanced.getTransactions({
      transactions: [
        "4jZNT882jBCSReECrssxVHaLKV5RPxuGSFUDhoJmzj6AbPBfHakFsTC27HBfGVE7rPsCbcBjUeZPNUDmm3U218Rg",
      ],
      commitment: "confirmed",
    });
    console.log("Fetched assets:", txns);
  } catch (error) {
    console.error("Error:", error);
  }
})();
