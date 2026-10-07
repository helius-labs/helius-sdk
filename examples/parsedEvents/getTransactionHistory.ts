// Replace imports in a production setting
import { createHelius } from "../../src/rpc/index";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    let paginationToken: string | null | undefined;
    let pages = 0;

    // Fetch up to three pages (100 transactions each, the default), newest first
    do {
      const page = await helius.parsedEvents.getTransactionHistory({
        address: "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY",
        paginationToken,
      });

      for (const result of page.data) {
        console.log(result.signature, result.parsed?.summary?.type ?? "unknown");
      }

      paginationToken = page.paginationToken;
      pages++;
    } while (paginationToken && pages < 3);
  } catch (error) {
    console.error("Error:", error);
  }
})();
