import { Webhook } from "../types";

export const parseWebhook = (webhook: any): Webhook => {
  webhook && delete webhook["wallet"];
  return webhook as Webhook;
};
