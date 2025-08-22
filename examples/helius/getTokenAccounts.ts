// Replace imports in a production setting
import { createHelius } from "../../src/rpc/index";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const assets = await helius.getTokenAccounts({
      owner: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
      limit: 10,
      after: "UGWUWf8HZscd6AnEsUnCXMVteXtvqdKuZD45YzWej8w",
    });
    console.log("Fetched assets:", assets);
  } catch (error) {
    console.error("Error:", error);
  }
})();
