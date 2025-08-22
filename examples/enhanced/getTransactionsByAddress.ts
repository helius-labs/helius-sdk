// Replace imports in a production setting
import { createHelius } from "../../src/rpc/index";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const txns = await helius.enhanced.getTransactionsByAddress({
      address: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
      limit: 5,
      commitment: "finalized",
    });
    console.log("Fetched assets:", txns);
  } catch (error) {
    console.error("Error:", error);
  }
})();
