import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius("YOUR_API_KEY");

  const jitoApiUrl = "https://mainnet.block-engine.jito.wtf/api/v1/bundles";

  // Replace this with your real base58-encoded transaction
  const serializedTransactions: string[] = [
    "BASE58_ENCODED_TRANSACTION_STRING_HERE",
  ];

  const bundleId = await helius.rpc.sendJitoBundle(
    serializedTransactions,
    jitoApiUrl
  );

  console.log(`Bundle sent to Jito. Bundle ID: ${bundleId}`);
}

main().catch((err) => {
  console.error("Example failed:", err);
  process.exit(1);
});
