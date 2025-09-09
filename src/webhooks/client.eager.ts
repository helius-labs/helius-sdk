import type {
  CreateWebhookRequest,
  UpdateWebhookRequest,
  Webhook,
} from "../types/webhooks";
import { createWebhook } from "./createWebhook";
import { getWebhook } from "./getWebhook";
import { getAllWebhooks } from "./getAllWebhooks";
import { updateWebhook } from "./updateWebhook";
import { deleteWebhook } from "./deleteWebhook";

export interface WebhookClient {
  create(params: CreateWebhookRequest): Promise<Webhook>;
  get(webhookID: string): Promise<Webhook>;
  getAll(): Promise<Webhook[]>;
  update(webhookID: string, params: UpdateWebhookRequest): Promise<Webhook>;
  delete(webhookID: string): Promise<boolean>;
}

export const makeWebhookClientEager = (apiKey: string): WebhookClient => ({
  create: (p) => createWebhook(apiKey, p),
  get: (id) => getWebhook(apiKey, id),
  getAll: () => getAllWebhooks(apiKey),
  update: (id, p) => updateWebhook(apiKey, id, p),
  delete: (id) => deleteWebhook(apiKey, id),
});
