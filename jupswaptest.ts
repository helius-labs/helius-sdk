import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Helius } from './src/Helius';
import bs58 from 'bs58';

// Function to create Keypair from secret key (supports both base58 and array formats)
function createKeypairFromSecretKey(secretKey: string): Keypair {
  try {
    // Try to parse as JSON array first
    if (secretKey.startsWith('[')) {
      const keyArray = JSON.parse(secretKey);
      const keyUint8Array = new Uint8Array(keyArray);
      return Keypair.fromSecretKey(keyUint8Array);
    }
    
    // Fall back to base58 format
    const decodedKey = bs58.decode(secretKey);
    return Keypair.fromSecretKey(decodedKey);
  } catch (error) {
    throw new Error(`Invalid secret key format. Expected base58 string or JSON array. Error: ${error}`);
  }
}

async function testJupiterSwap(secretKey: string) {
  try {
    // Initialize Helius with your API key and cluster
    const helius = new Helius('91b66bb9-8b86-424f-a1a7-4bc35914931a', 'mainnet-beta');

    // Create wallet from provided secret key
    const wallet = createKeypairFromSecretKey(secretKey);

    // Define swap parameters with optimized transaction landing settings
    const swapParams = {
      inputMint: 'So11111111111111111111111111111111111111112', // SOL
      outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
      amount: 1000000, // 0.001 SOL
      slippageBps: 50, // 0.5% slippage
      restrictIntermediateTokens: true,
      wrapUnwrapSOL: true,
      priorityLevel: 'medium' as 'medium', // Priority level for transaction
      maxPriorityFeeLamports: 1000000, // Max 0.001 SOL for priority fee
      maxRetries: 2, // Retry sending up to 2 times
      skipPreflight: true, // Skip preflight checks
      confirmationCommitment: 'confirmed' as 'confirmed' // Wait for confirmation
    };

    console.log('Starting Jupiter swap test with optimized transaction landing...');
    console.log('Wallet public key:', wallet.publicKey.toString());
    
    // Check wallet balance first
    const balance = await helius.connection.getBalance(wallet.publicKey);
    console.log('Current balance:', (balance / 1e9).toFixed(6), 'SOL');
    
    // Request airdrop if balance is too low
    const minRequiredBalance = 5000000; // 0.005 SOL minimum
    if (balance < minRequiredBalance) {
      console.log('⚠️  Balance too low. Requesting airdrop...');
      try {
        await helius.rpc.airdrop(wallet.publicKey, 10000000); // 0.01 SOL
        const newBalance = await helius.connection.getBalance(wallet.publicKey);
        console.log('✅ Airdrop completed. New balance:', (newBalance / 1e9).toFixed(6), 'SOL');
      } catch (airdropError) {
        console.warn('Airdrop failed:', airdropError);
        console.log('You may need to fund this wallet manually with SOL');
      }
    }
    
    console.log('Swap parameters:', JSON.stringify(swapParams, null, 2));

    // Execute the swap using Helius SDK
    console.log('Executing swap...');
    const result = await helius.rpc.executeJupiterSwap(swapParams, wallet);

    // Log results with enhanced details
    if (result.success && result.confirmed) {
      console.log('\nSwap successful! ✅');
      console.log('Transaction signature:', result.signature);
      console.log('Transaction link:', result.explorerUrl);
      console.log('Input amount:', formatAmount(result.inputAmount, 9), 'SOL');
      console.log('Output amount:', formatAmount(result.outputAmount, 6), 'USDC');
      console.log('Minimum output with slippage:', formatAmount(result.minimumOutputAmount, 6), 'USDC');
      console.log('\nTransaction details:');
      console.log(`- Priority fee: ${result.prioritizationFeeLamports} lamports`);
      console.log(`- Compute unit limit: ${result.computeUnitLimit} CU`);
      console.log(`- Last valid block height: ${result.lastValidBlockHeight}`);
      console.log(`- Confirmation status: ${result.confirmationStatus}`);
    } else {
      console.error('\nSwap failed! ❌');
      console.error('Error:', result.error);
      if (result.signature) {
        console.error('Transaction may have been sent. Signature:', result.signature);
        console.error('Check transaction:', `https://solscan.io/tx/${result.signature}`);
      }
    }

  } catch (error) {
    console.error('Test failed with error:', error);
  }
}

// Helper function to format amounts for better readability
function formatAmount(amount: number | undefined, decimals: number): string {
  if (!amount) return '0';
  return (amount / Math.pow(10, decimals)).toFixed(decimals);
}

// Example usage:
const YOUR_SECRET_KEY = '[206,135,161,9,106,223,99,45,219,89,233,123,101,53,231,96,14,68,89,242,182,110,96,121,97,34,61,121,224,158,100,232,19,92,150,210,126,19,101,148,173,78,134,211,50,54,82,53,23,242,6,153,228,126,117,190,82,177,94,245,252,112,213,130]';
testJupiterSwap(YOUR_SECRET_KEY).then(() => {
  console.log('\nTest completed');
}).catch((error) => {
  console.error('Test failed:', error);
});
