import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  const response = await helius.rpc.getAssetsByOwner({
    ownerAddress: '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY',
    page: 1,
  });

  console.log(response.items);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});
