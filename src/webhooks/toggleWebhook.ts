import type { Webhook } from "../types/webhooks";
import { getSDKHeaders } from "../http";

export const toggleWebhook = async (
  apiKey: string,
  webhookID: string,
  active: boolean,
  userAgent?: string
): Promise<Webhook> => {
  const url = `https://api.helius.xyz/v0/webhooks/${webhookID}?api-key=${apiKey}`;

  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...getSDKHeaders(userAgent),
    },
    body: JSON.stringify({ active }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  if (data.error) {
    throw new Error(`Helius error: ${JSON.stringify(data.error)}`);
  }

  return data as Webhook;
};
