// Replace imports in a production setting
import { createHelius } from "../../src/rpc/index";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const assets = await helius.getAssetsByOwner({
      ownerAddress: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
      page: 1,
      limit: 50,
      sortBy: { sortBy: "created", sortDirection: "asc" },
    });
    console.log("Fetched assets:", assets);
  } catch (error) {
    console.error("Error:", error);
  }
})();
