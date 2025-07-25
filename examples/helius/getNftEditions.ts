// Replace imports in a production setting
import { createHelius } from "../../src/rpc/index";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const assets = await helius.getNftEditions({ mint: "Ey2Qb8kLctbchQsMnhZs5DjY32To2QtPuXNwWvk4NosL" });
    console.log("Fetched assets:", assets);
  } catch (error) {
    console.error("Error:", error);
  }
})();
