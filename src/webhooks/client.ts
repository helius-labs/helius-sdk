import type {
  CreateWebhookRequest,
  UpdateWebhookRequest,
  Webhook,
} from "../types/webhooks";

/** Client for managing Helius webhook subscriptions. */
export interface WebhookClient {
  /** Create a new webhook subscription. */
  create(params: CreateWebhookRequest): Promise<Webhook>;
  /** Get a webhook by its ID. */
  get(webhookID: string): Promise<Webhook>;
  /** List all webhooks for the current API key. */
  getAll(): Promise<Webhook[]>;
  /** Update an existing webhook's configuration. */
  update(webhookID: string, params: UpdateWebhookRequest): Promise<Webhook>;
  /** Delete a webhook. Returns `true` on success. */
  delete(webhookID: string): Promise<boolean>;
}

export const makeWebhookClient = (
  apiKey: string,
  userAgent?: string
): WebhookClient => ({
  create: async (p) =>
    (await import("./createWebhook.js")).createWebhook(apiKey, p, userAgent),
  get: async (id) =>
    (await import("./getWebhook.js")).getWebhook(apiKey, id, userAgent),
  getAll: async () =>
    (await import("./getAllWebhooks.js")).getAllWebhooks(apiKey, userAgent),
  update: async (id, p) =>
    (await import("./updateWebhook.js")).updateWebhook(
      apiKey,
      id,
      p,
      userAgent
    ),
  delete: async (id) =>
    (await import("./deleteWebhook.js")).deleteWebhook(apiKey, id, userAgent),
});
