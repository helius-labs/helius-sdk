import { Webhook, CreateWebhookRequest, EditWebhookRequest } from "./types";
export * as Types from './types';
export declare class Helius {
    private apiKey;
    constructor(apiKey: string);
    getAllWebhooks(): Promise<Webhook[]>;
    getWebhookByID(webhookID: string): Promise<Webhook>;
    createWebhook(createWebhookRequest: CreateWebhookRequest): Promise<Webhook>;
    deleteWebhook(webhookID: string): Promise<boolean>;
    editWebhook(webhookID: string, editWebhookRequest: EditWebhookRequest): Promise<Webhook>;
    appendAddressesToWebhook(webhookID: string, newAccountAddresses: string[]): Promise<Webhook>;
}
