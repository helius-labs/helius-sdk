import type {
  BlockhashWithExpiryBlockHeight,
  Cluster,
  Keypair,
  SendOptions,
  SerializeConfig,
  Signer,
  Transaction,
  TransactionConfirmationStatus,
  TransactionError,
  VersionedTransaction,
  SendOptions as SolanaWebJsSendOptions,
} from '@solana/web3.js';

import type {
  WebhookType,
  TokenStandard,
  TransactionType,
  Source,
  ProgramName,
  TransactionContext,
  TxnStatus,
  AccountWebhookEncoding,
  PriorityLevel,
  UiTransactionEncoding,
} from './enums';

export type HeliusCluster = Omit<Cluster, 'testnet'>;

export type SmartTransactionContext = {
  transaction: Transaction | VersionedTransaction;
  blockhash: BlockhashWithExpiryBlockHeight;
  minContextSlot: number;
};

export interface HeliusEndpoints {
  api: string;
  rpc: string;
}

export type HeliusOptions = {
  limit?: number;
  paginationToken?: string;
};

export interface Webhook {
  webhookID: string;
  wallet: string;
  project: string;
  webhookURL: string;
  transactionTypes: TransactionType[];
  accountAddresses: string[];
  accountAddressOwners?: string[];
  webhookType?: WebhookType;
  authHeader?: string;
  txnStatus?: TxnStatus;
  encoding?: AccountWebhookEncoding;
}

export type CollectionIdentifier = {
  firstVerifiedCreators?: string[];
  verifiedCollectionAddresses?: string[];
};

export type CreateWebhookRequest = Omit<
  Webhook,
  'webhookID' | 'wallet' | 'project'
>;
export type EditWebhookRequest = Partial<
  Omit<Webhook, 'webhookID' | 'wallet' | 'project'>
>;

export interface CreateCollectionWebhookRequest extends CreateWebhookRequest {
  collectionQuery: CollectionIdentifier;
}

export interface MintlistResponse {
  result: MintlistItem[];
  paginationToken: string;
}

export type MintlistRequest = {
  query: CollectionIdentifier;
  options?: HeliusOptions;
};

export interface MintlistItem {
  mint: string;
  name: string;
}

export interface RawTokenAmount {
  tokenAmount: string;
  decimals: number;
}

export interface TokenBalanceChange {
  userAccount: string;
  tokenAccount: string;
  rawTokenAmount: RawTokenAmount;
  mint: string;
}

export interface AccountData {
  account: string;
  nativeBalanceChange: number;
  tokenBalanceChanges: TokenBalanceChange[] | null;
}

export interface TokenTransfer {
  fromUserAccount: string | null;
  toUserAccount: string | null;
  fromTokenAccount: string | null;
  toTokenAccount: string | null;
  tokenAmount: number;
  decimals: number;
  tokenStandard: TokenStandard;
  mint: string;
}

export interface NativeBalanceChange {
  account: string;
  amount: number;
}

export interface NativeTransfer {
  fromUserAccount: string | null;
  toUserAccount: string | null;
  amount: number;
}

export type Instruction = {
  accounts: string[];
  data: string;
  programId: string;
  innerInstructions: InnerInstruction[];
};

export type InnerInstruction = {
  accounts: string[];
  data: string;
  programId: string;
};

export interface ProgramInfo {
  source: Source;
  account: string;
  programName: ProgramName;
  instructionName: string;
}

export interface TokenSwap {
  nativeInput: NativeTransfer | null;
  nativeOutput: NativeTransfer | null;
  tokenInputs: TokenTransfer[];
  tokenOutputs: TokenTransfer[];
  tokenFees: TokenTransfer[];
  nativeFees: NativeTransfer[];
  programInfo: ProgramInfo;
}

export interface SwapEvent {
  nativeInput: NativeBalanceChange;
  nativeOutput: NativeBalanceChange;
  tokenInputs: TokenBalanceChange[];
  tokenOutputs: TokenBalanceChange[];
  tokenFees: TokenBalanceChange[];
  nativeFees: NativeBalanceChange[];
  innerSwaps: TokenSwap[];
}

export interface CompressedNftCreator {
  address: string;
  share: number;
  verified: boolean;
}

export interface CompressedNftMetadata {
  collection: {
    key: string;
    verified: boolean;
  };
  creators: CompressedNftCreator[];
  isMutable: boolean;
  name: string;
  primarySaleHappened: boolean;
  sellerFeeBasisPoints: number;
  symbol: string;
  tokenProgramVersion: string;
  tokenStandard: TokenStandard;
  uri: string;
}

export interface CompressedNftEvent {
  type: TransactionType;
  treeId: string;
  leafIndex: number | null;
  seq: number | null;
  assetId: string | null;
  instructionIndex: number | null;
  innerInstructionIndex: number | null;
  newLeafOwner: string | null;
  oldLeafOwner: string | null;
  newLeafDelegate: string | null;
  oldLeafDelegate: string | null;
  treeDelegate: string | null;
  metadata: CompressedNftMetadata | null;
}

export interface Token {
  mint: string;
  tokenStandard: TokenStandard;
}

export interface NFTEvent {
  seller: string;
  buyer: string;
  timestamp: number;
  amount: number;
  fee: number;
  signature: string;
  source: Source;
  type: TransactionType;
  saleType?: TransactionContext;
  nfts: Token[];
}

export interface TransactionEvent {
  nft: NFTEvent | null;
  swap: SwapEvent | null;
  compressed: CompressedNftEvent[] | null;
}

export interface EnrichedTransaction {
  description: string;
  type: TransactionType;
  source: Source;
  fee: number;
  feePayer: string;
  signature: string;
  slot: number;
  timestamp: number;
  nativeTransfers: NativeTransfer[] | null;
  tokenTransfers: TokenTransfer[] | null;
  accountData: AccountData[];
  transactionError: TransactionError | null;
  instructions: Instruction[];
  events: TransactionEvent;
}

export interface MintApiRequest {
  name: string;
  symbol: string;
  description?: string;
  owner: string;
  delegate?: string;
  collection?: string;
  creators?: {
    address: string;
    share: number;
  }[];
  uri?: string;
  sellerFeeBasisPoints?: number;
  imageUrl?: string;
  externalUrl?: string;
  attributes?: {
    trait_type: string;
    value: string;
  }[];
  imagePath?: string;
  walletPrivateKey?: string;
}

export interface MintApiResponse {
  jsonrpc: string;
  id: string;
  result: {
    signature: string;
    minted: boolean;
    assetId: string;
  };
}

export interface DelegateCollectionAuthorityRequest {
  collectionMint: string;
  newCollectionAuthority?: string;
  updateAuthorityKeypair: Keypair;
  payerKeypair?: Keypair;
}

export interface RevokeCollectionAuthorityRequest {
  collectionMint: string;
  delegatedCollectionAuthority?: string;
  revokeAuthorityKeypair: Keypair;
  payerKeypair?: Keypair;
}

// RWA Asset Types
interface AssetControllerAccount {
  address: string;
  mint: string;
  authority: string;
  delegate: string;
  version: number;
  closed: boolean;
}

interface DataRegistryAccount {
  address: string;
  mint: string;
  version: number;
  closed: boolean;
}

interface IdentityRegistryAccount {
  address: string;
  mint: string;
  authority: string;
  delegate: string;
  version: number;
  closed: boolean;
}

interface PolicyEngine {
  address: string;
  mint: string;
  authority: string;
  delegate: string;
  policies: string[];
  version: number;
  closed: boolean;
}

export interface FullRwaAccount {
  asset_controller?: AssetControllerAccount;
  data_registry?: DataRegistryAccount;
  identity_registry?: IdentityRegistryAccount;
  policy_engine?: PolicyEngine;
}

export interface GetPriorityFeeEstimateOptions {
  priorityLevel?: PriorityLevel;
  includeAllPriorityFeeLevels?: boolean;
  transactionEncoding?: UiTransactionEncoding;
  lookbackSlots?: number;
  recommended?: boolean;
}

export interface GetPriorityFeeEstimateRequest {
  transaction?: string;
  accountKeys?: string[];
  options?: GetPriorityFeeEstimateOptions;
}

export interface MicroLamportPriorityFeeLevels {
  min: number;
  low: number;
  medium: number;
  high: number;
  veryHigh: number;
  unsafeMax: number;
}

export interface GetPriorityFeeEstimateResponse {
  priorityFeeEstimate?: number;
  priorityFeeLevels?: MicroLamportPriorityFeeLevels;
}

export type JitoRegion = 'Default' | 'NY' | 'Amsterdam' | 'Frankfurt' | 'Tokyo';

export type PollTransactionOptions = {
  confirmationStatuses?: TransactionConfirmationStatus[];
  // In milliseconds
  timeout?: number;
  // In milliseconds
  interval?: number;
};

export interface SmartTransactionOptions extends SendOptions {
  feePayer?: Signer;
  lastValidBlockHeightOffset?: number;
  priorityFeeCap?: number;
  serializeOptions?: SerializeConfig;
}

export interface HeliusSendOptions extends SolanaWebJsSendOptions {
  validatorAcls?: string[];
}

export interface ParseTransactionsRequest {
  transactions: string[];
}

export type ParseTransactionsResponse = EnrichedTransaction[];

export interface JupiterSwapParams {
  inputMint: string;
  outputMint: string;
  amount: number;
  maxDynamicSlippageBps?: number;
  wrapUnwrapSOL?: boolean;
}

export interface JupiterSwapResult {
  signature: string;
  success: boolean;
  error?: string;
  inputAmount?: number;
  outputAmount?: number;
}
