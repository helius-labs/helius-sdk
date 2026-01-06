# Priority Fees

How to use `getPriorityFeeEstimate` to land transactions during congestion.

## API Endpoint

```
POST https://mainnet.helius-rpc.com/?api-key=<API_KEY>
```

### Request

```json
{
  "jsonrpc": "2.0",
  "id": "1",
  "method": "getPriorityFeeEstimate",
  "params": [{
    "accountKeys": ["JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4"],
    "options": {
      "includeAllPriorityFeeLevels": true
    }
  }]
}
```

### Response

```json
{
  "jsonrpc": "2.0",
  "result": {
    "priorityFeeLevels": {
      "min": 0,
      "low": 1000,
      "medium": 10000,
      "high": 100000,
      "veryHigh": 1000000,
      "unsafeMax": 10000000
    }
  }
}
```

## Fee Levels

| Level | When to Use |
|-------|-------------|
| min | Testing, don't care about speed |
| low | Background jobs, can wait |
| medium | Normal transactions |
| high | Need it in the next few slots |
| veryHigh | Arbitrage, liquidations |
| unsafeMax | Last resort, will overpay |

## Implementation

### Basic Usage

```typescript
import { Connection } from '@solana/web3.js';

const HELIUS_URL = `https://mainnet.helius-rpc.com/?api-key=${API_KEY}`;
const connection = new Connection(HELIUS_URL);

async function getPriorityFee(
  accountKeys: string[],
  level: 'min' | 'low' | 'medium' | 'high' | 'veryHigh' = 'medium'
): Promise<number> {
  const response = await fetch(HELIUS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: '1',
      method: 'getPriorityFeeEstimate',
      params: [{
        accountKeys,
        options: { includeAllPriorityFeeLevels: true }
      }]
    })
  });

  const { result } = await response.json();
  return result.priorityFeeLevels[level];
}
```

### Adding to Transaction

```typescript
import {
  ComputeBudgetProgram,
  Transaction,
  TransactionInstruction
} from '@solana/web3.js';

async function buildTransaction(
  instructions: TransactionInstruction[],
  accountKeys: string[],
  feeLevel: 'medium' | 'high' | 'veryHigh' = 'medium'
): Promise<Transaction> {
  const priorityFee = await getPriorityFee(accountKeys, feeLevel);

  const tx = new Transaction();

  // Set compute unit price (priority fee)
  tx.add(
    ComputeBudgetProgram.setComputeUnitPrice({
      microLamports: priorityFee
    })
  );

  // Optional: Set compute unit limit if known
  tx.add(
    ComputeBudgetProgram.setComputeUnitLimit({
      units: 200_000
    })
  );

  // Add program instructions
  instructions.forEach(ix => tx.add(ix));

  return tx;
}
```

### Account-Specific Fees

Fees vary by account contention. Jupiter needs higher fees than your custom program.

```typescript
// High contention
const jupiterFee = await getPriorityFee(
  ['JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4'],
  'high'
);

// Low contention
const customFee = await getPriorityFee(
  ['YourProgram...'],
  'medium'
);
```

## Strategies

### Static

```typescript
const FEE_LEVELS = {
  background: 'low',
  standard: 'medium',
  urgent: 'high',
  critical: 'veryHigh'
} as const;

async function getStaticFee(
  accounts: string[],
  priority: keyof typeof FEE_LEVELS
): Promise<number> {
  return getPriorityFee(accounts, FEE_LEVELS[priority]);
}
```

### Retry with Escalation

```typescript
async function sendWithRetry(
  tx: Transaction,
  accountKeys: string[],
  maxRetries: number = 3
): Promise<string> {
  const levels = ['medium', 'high', 'veryHigh'] as const;

  for (let i = 0; i < maxRetries; i++) {
    const level = levels[Math.min(i, levels.length - 1)];
    const fee = await getPriorityFee(accountKeys, level);

    // Update transaction with new fee
    const updatedTx = await rebuildWithFee(tx, fee);

    try {
      return await sendAndConfirmTransaction(connection, updatedTx, [payer]);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1} with ${level} fee`);
    }
  }
}
```

### Deadline-Based

```typescript
function calculateDeadlineFee(
  baseFee: number,
  deadlineMs: number,
  elapsedMs: number
): number {
  const remaining = Math.max(0, deadlineMs - elapsedMs);
  const urgency = 1 - (remaining / deadlineMs);

  // Exponential increase as deadline approaches
  const multiplier = 1 + Math.pow(urgency, 2) * 9; // 1x to 10x

  return Math.floor(baseFee * multiplier);
}
```

## Cost Calculation

Total transaction cost = base fee + (compute units * priority fee / 1,000,000)

```typescript
function estimateCost(
  computeUnits: number,
  priorityFeePerCU: number
): number {
  const baseFee = 5000; // lamports
  const priorityCost = (computeUnits * priorityFeePerCU) / 1_000_000;
  return baseFee + priorityCost;
}

// Example: 200k CU at 10,000 microlamports/CU
const cost = estimateCost(200_000, 10_000);
// = 5000 + 2000 = 7000 lamports = 0.000007 SOL
```

## Tips

- Include all accounts your tx touches when querying - fees vary by account contention
- Cache for 10-30s max, fees change fast
- Always set compute unit limit, otherwise you pay for 1.4M CU
- Track actual vs estimated fees to tune your strategy

## Troubleshooting

**Tx dropped after 60s** - fee too low, bump to next level or add retry logic

**Overpaying** - use account-specific queries, not global estimates

**Estimates always wrong** - reduce cache TTL, query right before sending

## Links

- [Helius Priority Fee API](https://docs.helius.dev/solana-rpc-nodes/alpha-priority-fee-api)
- [Solana Compute Budget](https://solana.com/docs/core/fees)
