import { Webhook, CreateWebhookRequest } from "./types";
export declare class Helius {
    private apiKey;
    constructor(apiKey: string);
    getWebhooks(): Promise<Webhook[]>;
    getWebhookByID(webhookID: string): Promise<Webhook>;
    createWebhook(createWebhookRequest: CreateWebhookRequest): Promise<Webhook>;
    deleteWebhook(webhookID: string): Promise<boolean>;
}
