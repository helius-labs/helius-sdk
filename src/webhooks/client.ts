import type {
  CreateWebhookRequest,
  UpdateWebhookRequest,
  Webhook,
} from "../types/webhooks";

export interface WebhookClient {
  create(params: CreateWebhookRequest): Promise<Webhook>;
  get(webhookID: string): Promise<Webhook>;
  getAll(): Promise<Webhook[]>;
  update(webhookID: string, params: UpdateWebhookRequest): Promise<Webhook>;
  delete(webhookID: string): Promise<boolean>;
}

export const makeWebhookClient = (apiKey: string): WebhookClient => ({
  create: async (p) =>
    (await import("./createWebhook.js")).createWebhook(apiKey, p),
  get: async (id) => (await import("./getWebhook.js")).getWebhook(apiKey, id),
  getAll: async () =>
    (await import("./getAllWebhooks.js")).getAllWebhooks(apiKey),
  update: async (id, p) =>
    (await import("./updateWebhook.js")).updateWebhook(apiKey, id, p),
  delete: async (id) =>
    (await import("./deleteWebhook.js")).deleteWebhook(apiKey, id),
});
