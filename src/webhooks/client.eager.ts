import type {
  CreateWebhookRequest,
  UpdateWebhookRequest,
  Webhook,
} from "../types/webhooks.js";
import { createWebhook } from "./createWebhook.js";
import { getWebhook } from "./getWebhook.js";
import { getAllWebhooks } from "./getAllWebhooks.js";
import { updateWebhook } from "./updateWebhook.js";
import { deleteWebhook } from "./deleteWebhook.js";
import { toggleWebhook } from "./toggleWebhook.js";

export interface WebhookClient {
  create(params: CreateWebhookRequest): Promise<Webhook>;
  get(webhookID: string): Promise<Webhook>;
  getAll(): Promise<Webhook[]>;
  update(webhookID: string, params: UpdateWebhookRequest): Promise<Webhook>;
  delete(webhookID: string): Promise<boolean>;
  toggle(webhookID: string, active: boolean): Promise<Webhook>;
}

export const makeWebhookClientEager = (
  apiKey: string,
  userAgent?: string
): WebhookClient => ({
  create: (p) => createWebhook(apiKey, p, userAgent),
  get: (id) => getWebhook(apiKey, id, userAgent),
  getAll: () => getAllWebhooks(apiKey, userAgent),
  update: (id, p) => updateWebhook(apiKey, id, p, userAgent),
  delete: (id) => deleteWebhook(apiKey, id, userAgent),
  toggle: (id, active) => toggleWebhook(apiKey, id, active, userAgent),
});
