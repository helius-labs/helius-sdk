export interface CreateWebhookRequest {
    webhookURL: string;
    transactionTypes: string[];
    accountAddresses: string[];
    webhookType?: string;
    authHeader?: string;
    encoding?: string;
    txnStatus?: string;
}

export interface CreateWebhookResponse {
    webhookID: string;
    wallet: string;
    webhookURL: string;
    transactionTypes: string[];
    accountAddresses: string[];
    webhookType: string;
    authHeader: string;
}