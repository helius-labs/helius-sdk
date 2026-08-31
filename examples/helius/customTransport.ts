import { createHelius, type RpcTransport } from "helius-sdk";

const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Wrap the SDK's default transport with a retry policy. The wrapped
// transport is used for every JSON-RPC call — standard Solana RPC and
// DAS/Helius methods alike.
const withRetries =
  (maxAttempts: number) =>
  (defaultTransport: RpcTransport): RpcTransport =>
  async (request) => {
    let lastError: unknown;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        return await defaultTransport(request);
      } catch (error) {
        lastError = error;
        await sleep(2 ** attempt * 100); // Exponential backoff
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error(`RPC failed after ${maxAttempts} attempts`);
  };

(async () => {
  const apiKey = ""; // From Helius dashboard
  const helius = createHelius({ apiKey, transport: withRetries(3) });

  try {
    const asset = await helius.getAsset({
      id: "F9Lw3ki3hJ7PF9HQXsBzoY8GyE6sPoEZZdXJBsTTD2rk",
    });

    console.log("Asset: ", asset);
  } catch (error) {
    console.error("Error with RPC: ", error);
  }
})();
