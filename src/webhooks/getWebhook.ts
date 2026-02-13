import { Webhook } from "../types/webhooks";
import { getSDKHeaders } from "../http";

export const getWebhook = async (
  apiKey: string,
  webhookID: string,
  userAgent?: string
): Promise<Webhook> => {
  const url = `https://api.helius.xyz/v0/webhooks/${webhookID}?api-key=${apiKey}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...getSDKHeaders(userAgent),
    },
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
