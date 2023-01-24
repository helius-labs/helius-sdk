export interface Webhook {
    webhookID: string,
    wallet: string,
    webhookURL: string,
    transactionTypes: string[],
    accountAddresses: string[],
    webhookType: string,
    authHeader: string
}

export type CreateWebhookRequest = Omit<Webhook, 'webhookID' & 'wallet'>;

