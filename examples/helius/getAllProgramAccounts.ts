import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  const programId = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";

  try {
    const allTokenAccounts = await helius.getAllProgramAccounts(programId, {
    encoding: "jsonParsed",
    filters: [{ dataSize: 82 }],
    withContext: true,
  });

  console.log("Total accounts:", allTokenAccounts.length);
  } catch (error) {
    console.error("Error with RPC:", error);
  }
})();