export const deleteWebhook = async (
  apiKey: string,
  webhookID: string
): Promise<boolean> => {
  const url = `https://api.helius.xyz/v0/webhooks/${webhookID}?api-key=${apiKey}`;

  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
  }

  const contentLength = response.headers?.get?.("content-length");
  const noBody = response.status === 204 || contentLength === "0";

  if (noBody) {
    return true;
  }

  // If there *is* a body, try to read it; if it's empty/invalid, just succeed.
  let data: any;
  try {
    data = await response.json();
  } catch {
    return true;
  }

  if (data?.error) {
    throw new Error(`Helius error: ${JSON.stringify(data.error)}`);
  }

  return true;
};