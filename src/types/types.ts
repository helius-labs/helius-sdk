import type { TransactionError } from "@solana/web3.js";

import type {
    WebhookType,
    TokenStandard,
    TransactionType,
    Source
} from "./enums"

export interface GetMintlistResponse {
    result: MintlistObject[],
    paginationToken: string
}

export type GetMintlistRequest = {
    query: CollectionIdentifier,
    options?: HeliusOptions
}

export type CreateCollectionWebhookRequest = {
    collectionQuery: CollectionIdentifier
    webhookURL: string,
    transactionTypes: string[],
    webhookType?: WebhookType,
    authHeader?: string
}

export interface Webhook {
    webhookID: string,
    wallet: string,
    webhookURL: string,
    transactionTypes: string[],
    accountAddresses: string[],
    webhookType?: WebhookType,
    authHeader?: string
}

export type CreateWebhookRequest = Omit<Webhook, 'webhookID' | 'wallet'>;
export type EditWebhookRequest = Omit<Webhook, 'webhookID' | 'wallet'>;

export interface MintlistObject {
    mint: string,
    name: string,
}

export type CollectionIdentifier = {
    firstVerifiedCreators?: string[],
    verifiedCollectionAddresses?: string[],
}

export type HeliusOptions = {
    limit?: number,
    paginationToken?: string
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

export interface Token {
    mint: string;
    tokenStandard: TokenStandard;
}

export interface TokenTransfer {
    fromUserAccount: string | null;
    toUserAccount: string | null;
    fromTokenAccount: string | null;
    toTokenAccount: string | null;
    rawTokenAmount: number;
    decimals: number;
    tokenStandard: TokenStandard;
    mint: string;
}

export interface NativeTransfer {
    fromUserAccount: string | null;
    toUserAccount: string | null;
    amount: number;

}

export interface NativeBalanceChange {
    account: string;
    amount: string;
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
}

export interface EnrichedTransactionResponseV2 {
    type: TransactionType;
    description: string;
    source: Source;
    fee: number;
    feePayer: string;
    signature: string;
    timestamp: number;
    slot: number;
    tokenTransfers: TokenTransfer[] | null;
    nativeTransfers: NativeTransfer[] | null;
    accountData: AccountData[];
    transactionError: TransactionError | null;
    instructions: Instruction[];
    events: [];
}
