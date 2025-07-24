import type { CreateWebhookRequest, CreateWebhookResponse } from "../types/webhooks";

export const createWebhook = async (
  apiKey: string,
  params: CreateWebhookRequest
): Promise<CreateWebhookResponse> => {
  const url = `https://api.helius.xyz/v0/webhooks?api-key=${apiKey}`;

  const response = await fetch(url, {
    method: "POST",
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

  return data as CreateWebhookResponse;
};