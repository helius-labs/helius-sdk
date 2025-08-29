import { Helius } from "../../src"; // Replace with 'helius-sdk' in a production setting

async function main() {
  const helius = new Helius('YOUR_API_KEY');
  const ownerAddress = '86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY';

  // Example 1: Get all SPL token accounts for a wallet
  console.log('\n=== Example 1: Get SPL token accounts ===');
  const splTokenAccounts = await helius.rpc.getTokenAccountsByOwnerV2(
    ownerAddress,
    { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
    {
      encoding: 'jsonParsed',
      limit: 10
    }
  );
  
  console.log(`Found ${splTokenAccounts.value.count} token accounts`);
  console.log(`Context slot: ${splTokenAccounts.context.slot}`);
  console.log(`API version: ${splTokenAccounts.context.apiVersion}`);
  
  splTokenAccounts.value.accounts.forEach(account => {
    const parsed = account.account.data?.parsed;
    if (parsed?.info) {
      const tokenAmount = parsed.info.tokenAmount;
      console.log(`  Account ${account.pubkey.substring(0, 8)}...`);
      console.log(`    Mint: ${parsed.info.mint}`);
      console.log(`    Balance: ${tokenAmount?.uiAmountString || '0'}`);
    }
  });

  // Example 2: Continue pagination if needed
  if (splTokenAccounts.value.paginationKey) {
    console.log('\n=== Example 2: Fetching next page ===');
    const nextPage = await helius.rpc.getTokenAccountsByOwnerV2(
      ownerAddress,
      { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
      {
        encoding: 'jsonParsed',
        limit: 10,
        paginationKey: splTokenAccounts.value.paginationKey
      }
    );
    
    console.log(`Fetched ${nextPage.value.count} more accounts`);
  }

  // Example 3: Get accounts for a specific mint (e.g., USDC)
  console.log('\n=== Example 3: Get accounts for specific mint ===');
  const usdcMint = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'; // USDC mint
  const usdcAccounts = await helius.rpc.getTokenAccountsByOwnerV2(
    ownerAddress,
    { mint: usdcMint },
    {
      encoding: 'jsonParsed'
    }
  );
  
  if (usdcAccounts.value.accounts.length > 0) {
    console.log(`Found ${usdcAccounts.value.accounts.length} USDC account(s)`);
    const account = usdcAccounts.value.accounts[0];
    const parsed = account.account.data?.parsed;
    if (parsed?.info) {
      console.log(`  USDC Balance: ${parsed.info.tokenAmount?.uiAmountString || '0'}`);
    }
  } else {
    console.log('No USDC accounts found for this wallet');
  }

  // Example 4: Get Token-2022 accounts
  console.log('\n=== Example 4: Get Token-2022 accounts ===');
  const token2022Accounts = await helius.rpc.getTokenAccountsByOwnerV2(
    ownerAddress,
    { programId: 'TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb' }, // Token-2022 program
    {
      encoding: 'jsonParsed',
      limit: 5
    }
  );
  
  console.log(`Found ${token2022Accounts.value.count} Token-2022 accounts`);

  // Example 5: Get recently changed token accounts (incremental updates)
  console.log('\n=== Example 5: Recently changed accounts ===');
  const recentSlot = 363340000; // Replace with a recent slot
  const recentlyChanged = await helius.rpc.getTokenAccountsByOwnerV2(
    ownerAddress,
    { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
    {
      encoding: 'jsonParsed',
      limit: 5,
      changedSinceSlot: recentSlot
    }
  );
  
  console.log(`Found ${recentlyChanged.value.count} accounts changed since slot ${recentSlot}`);

  // Example 6: Auto-pagination to get all token accounts
  console.log('\n=== Example 6: Get all token accounts (auto-pagination) ===');
  const allTokenAccounts = await helius.rpc.getAllTokenAccountsByOwner(
    ownerAddress,
    { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
    {
      encoding: 'jsonParsed',
      limit: 100 // Fetch 100 at a time
    }
  );
  
  console.log(`Total token accounts: ${allTokenAccounts.length}`);
  
  // Group by mint
  const tokensByMint = new Map<string, number>();
  allTokenAccounts.forEach(account => {
    const parsed = account.account.data?.parsed;
    if (parsed?.info?.mint) {
      const mint = parsed.info.mint;
      const balance = parseFloat(parsed.info.tokenAmount?.uiAmountString || '0');
      tokensByMint.set(mint, (tokensByMint.get(mint) || 0) + balance);
    }
  });
  
  console.log('\nToken holdings summary:');
  tokensByMint.forEach((balance, mint) => {
    if (balance > 0) {
      console.log(`  ${mint.substring(0, 8)}...: ${balance}`);
    }
  });

  // Example 7: Using different encoding
  console.log('\n=== Example 7: Using base64 encoding ===');
  const base64Accounts = await helius.rpc.getTokenAccountsByOwnerV2(
    ownerAddress,
    { programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' },
    {
      encoding: 'base64',
      limit: 2
    }
  );
  
  console.log(`Fetched ${base64Accounts.value.count} accounts with base64 encoding`);
  base64Accounts.value.accounts.forEach(account => {
    console.log(`  Account ${account.pubkey.substring(0, 8)}...`);
    console.log(`    Data length: ${account.account.data[0].length} bytes`);
    console.log(`    Encoding: ${account.account.data[1]}`);
  });
}

main().catch((err) => {
  console.error('Example failed:', err);
  process.exit(1);
});