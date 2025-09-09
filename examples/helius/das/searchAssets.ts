import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const assets = await helius.searchAssets({ ownerAddress: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY", tokenType: "all", limit: 25 });
    console.log("Fetched assets: ", assets);
  } catch (error) {
    console.error("Error: ", error);
  }
})();