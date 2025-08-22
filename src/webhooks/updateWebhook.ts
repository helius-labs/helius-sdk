import type { UpdateWebhookRequest, Webhook } from "../types/webhooks";

export const updateWebhook = async (
  apiKey: string,
  webhookID: string,
  params: UpdateWebhookRequest
): Promise<Webhook> => {
  const url = `https://api.helius.xyz/v0/webhooks/${webhookID}?api-key=${apiKey}`;

  const response = await fetch(url, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(params),
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
