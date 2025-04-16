import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius("YOUR_API_KEY");

  const bundleIds: string[] = [
    // Replace with actual bundle IDs returned by `sendJitoBundle`
    "bundle-id-1",
    "bundle-id-2",
  ];

  const jitoApiUrl = "https://mainnet.block-engine.jito.wtf/api/v1/bundles";

  const statuses = await helius.rpc.getBundleStatuses(bundleIds, jitoApiUrl);

  console.log("Bundle Statuses:", statuses);
}

main().catch((err) => {
  console.error("Example failed:", err);
  process.exit(1);
});
