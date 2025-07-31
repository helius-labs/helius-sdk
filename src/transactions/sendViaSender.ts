import { Signature, signature } from "@solana/kit";
import { SenderRegion, senderFastUrl } from "./types";


/**
 * POST a base‑64 transaction to the chosen Sender region.
 * Sender mandates skipPreflight = true and maxRetries = 0
 *
 * Returns the transaction signature
 */
export const sendViaSender = async (
  tx64: string,
  region: SenderRegion = "Default",
  swqosOnly: boolean = false,
): Promise<Signature> => {
    const endpoint = swqosOnly
    ? `${senderFastUrl(region)}?swqos_only=true`
    : senderFastUrl(region);

  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now().toString(),
      method: "sendTransaction",
      params: [
        tx64,
        { encoding: "base64", skipPreflight: true, maxRetries: 0 },
      ],
    }),
  });

    /** Handle HTTP‑level failures early */
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sender HTTP ${res.status}: ${text.slice(0, 200)}`);
  }

  const body: unknown = await res.json();

  if (typeof body === "string") return signature(body);

  if (body && typeof body === "object") {
    if ("error" in body && (body as any).error)
      throw new Error(JSON.stringify((body as any).error));

    if ("result" in body && typeof (body as any).result === "string")
      return signature((body as any).result);
  }

  throw new Error(
    `Unexpected Sender response: ${JSON.stringify(body).slice(0, 200)}`,
  );
};
