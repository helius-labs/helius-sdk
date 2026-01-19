import type { Webhook } from "../types/webhooks";
import { SDK_USER_AGENT } from "../http";

export const getAllWebhooks = async (apiKey: string): Promise<Webhook[]> => {
  const url = `https://api.helius.xyz/v0/webhooks?api-key=${apiKey}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": SDK_USER_AGENT,
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

  return data as Webhook[];
};
