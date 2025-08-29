import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');

  // Example 1: Basic query with pagination
  console.log('\n=== Example 1: Basic query with pagination ===');
  const firstPage = await helius.rpc.getProgramAccountsV2(
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    {
      encoding: 'jsonParsed',
      limit: 10
    }
  );
  
  console.log(`Fetched ${firstPage.count} accounts`);
  console.log(`Pagination key: ${firstPage.paginationKey}`);
  console.log(`First account: ${firstPage.accounts[0]?.pubkey}`);

  // Example 2: Continue pagination if more results exist
  if (firstPage.paginationKey) {
    console.log('\n=== Example 2: Fetching next page ===');
    const secondPage = await helius.rpc.getProgramAccountsV2(
      'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
      {
        encoding: 'jsonParsed',
        limit: 10,
        paginationKey: firstPage.paginationKey
      }
    );
    
    console.log(`Fetched ${secondPage.count} more accounts`);
    console.log(`Next pagination key: ${secondPage.paginationKey}`);
  }

  // Example 3: Using filters to get specific accounts
  console.log('\n=== Example 3: Using filters for token accounts ===');
  const tokenAccounts = await helius.rpc.getProgramAccountsV2(
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    {
      encoding: 'jsonParsed',
      limit: 5,
      filters: [
        { dataSize: 165 }, // Filter for token accounts (165 bytes)
      ]
    }
  );
  
  console.log(`Found ${tokenAccounts.count} token accounts`);
  tokenAccounts.accounts.forEach(account => {
    const parsed = account.account.data?.parsed;
    if (parsed?.info) {
      console.log(`  Token account ${account.pubkey.substring(0, 8)}... with mint: ${parsed.info.mint?.substring(0, 8)}...`);
    }
  });

  // Example 4: Get accounts changed since a specific slot (incremental updates)
  console.log('\n=== Example 4: Incremental updates with changedSinceSlot ===');
  const recentSlot = 363340000; // Replace with a recent slot
  const changedAccounts = await helius.rpc.getProgramAccountsV2(
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    {
      encoding: 'jsonParsed',
      limit: 5,
      changedSinceSlot: recentSlot
    }
  );
  
  console.log(`Found ${changedAccounts.count} accounts changed since slot ${recentSlot}`);

  // Example 5: Auto-pagination to get all accounts (use with caution!)
  console.log('\n=== Example 5: Auto-pagination (limited for demo) ===');
  const allAccounts = await helius.rpc.getAllProgramAccounts(
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    {
      encoding: 'jsonParsed',
      limit: 100, // Fetch 100 at a time
      filters: [
        { dataSize: 82 }, // Filter for mint accounts (82 bytes) to reduce results
      ]
    }
  );
  
  console.log(`Total accounts fetched: ${allAccounts.length}`);

  // Example 6: Using memcmp filter to find accounts with specific data
  console.log('\n=== Example 6: Using memcmp filter ===');
  const specificOwner = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY';
  const memcmpAccounts = await helius.rpc.getProgramAccountsV2(
    'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    {
      encoding: 'base64',
      limit: 5,
      filters: [
        { dataSize: 165 },
        {
          memcmp: {
            offset: 32, // Owner field in token account
            bytes: specificOwner
          }
        }
      ]
    }
  );
  
  console.log(`Found ${memcmpAccounts.count} accounts owned by ${specificOwner.substring(0, 8)}...`);
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});