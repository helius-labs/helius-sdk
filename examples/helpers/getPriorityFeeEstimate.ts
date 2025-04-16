import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const response = await helius.rpc.getPriorityFeeEstimate({
    accountKeys: ['JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'],
    options: {
      includeAllPriorityFeeLevels: true,
    },
  });

  console.log('Priority fee estimate:', response);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
