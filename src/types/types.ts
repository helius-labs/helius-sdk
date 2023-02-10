import type { TransactionError } from "@solana/web3.js";

import type {
    WebhookType,
    TokenStandard,
    TransactionType,
    Source,
    ProgramName,
    TransactionContext,
} from "./enums";

export type HeliusOptions = {
    limit?: number;
    paginationToken?: string;
};

export interface Webhook {
    webhookID: string;
    wallet: string;
    webhookURL: string;
    transactionTypes: string[];
    accountAddresses: string[];
    webhookType?: WebhookType;
    authHeader?: string;
}

export type CollectionIdentifier = {
    firstVerifiedCreators?: string[];
    verifiedCollectionAddresses?: string[];
};

export type CreateWebhookRequest = Omit<Webhook, "webhookID" | "wallet">;
export type EditWebhookRequest = Partial<Omit<Webhook, "webhookID" | "wallet">>;

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
    tokenInputs: TokenBalanceChange;
    tokenOutputs: TokenBalanceChange;
    tokenFees: TokenBalanceChange;
    nativeFees: NativeBalanceChange;
    innerSwaps: TokenSwap;
}

export interface Token {
    mint: string;
    tokenStandard: TokenStandard;
}

export interface NFTEvent {
    seller: string;
    buyer: string;
    timestamp: number;
    transactionAmount: number;
    signature: string;
    source: Source;
    type: TransactionType;
    context?: TransactionContext;
    tokensInvolved: Token[];
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
    events: SwapEvent | NFTEvent;
}
