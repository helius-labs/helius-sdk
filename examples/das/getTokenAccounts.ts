import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const response = await helius.rpc.getTokenAccounts({
    page: 1,
    limit: 100,
    options: {
      showZeroBalance: false,
    },
    owner: 'CckxW6C1CjsxYcXSiDbk7NYfPLhfqAm3kSB5LEZunnSE',
  });

  console.log(response);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
