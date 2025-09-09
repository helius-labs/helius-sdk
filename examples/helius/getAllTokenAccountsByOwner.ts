import { createHelius } from "helius-sdk";

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey });

  const ownerAddress = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";

  try {
    const allTokenAccounts = await helius.getAllTokenAccountsByOwner(
      ownerAddress,
      { programId: "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" },
      { encoding: "jsonParsed" }
    );

  console.log(`Total token accounts: ${allTokenAccounts.length}`);

  // Group by mint
  const tokensByMint = new Map<string, number>();
  allTokenAccounts.forEach((account) => {
    const parsed = account.account.data?.parsed;
    if (parsed?.info?.mint) {
      const mint = parsed.info.mint;
      const balance = parseFloat(parsed.info.tokenAmount?.uiAmountString ?? "0");
      tokensByMint.set(mint, (tokensByMint.get(mint) || 0) + balance);
    }
  });
  console.log("\nToken holdings summary:");
  tokensByMint.forEach((balance, mint) => {
    if (balance > 0) console.log(`  ${mint.slice(0, 8)}...: ${balance}`);
  });

  } catch (error) {
    console.error("Error with RPC:", error);
  }

})();