// Replace imports in a production setting
import { createHelius } from "../../src/rpc/index";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  try {
    const results = await helius.parsedEvents.parseTransactions({
      transactions: [
        "5xSKzM8bvpudE521jikHqASzMr23Ms4X4ieY3K8oFPFrJWCSSgYocJmHznrR8b12voDxKDH8ykdCLXSRrx6duVLH",
      ],
    });

    for (const result of results) {
      if (result.parserStatus === "OK") {
        console.log(result.signature, result.parsed.summary?.description);
      } else {
        console.warn(result.signature, result.parserError);
      }
    }
  } catch (error) {
    console.error("Error:", error);
  }
})();
