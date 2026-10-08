import { Signature, signature } from "@solana/kit";
import { SenderRegion, senderFastUrl } from "./types";

/**
 * POST a base‑64 transaction to the chosen Sender region.
 *
 * `skipPreflight` is a caller-controlled passthrough (Sender no longer requires
 * it to be `true`); it defaults to `true` for backward compatibility. `maxRetries`
 * is fixed at 0. `mevProtect` adds `mev-protect=true` to route away from
 * validators linked to sandwich attacks.
 *
 * Returns the transaction signature
 */
export const sendViaSender = async (
  tx64: string,
  region: SenderRegion = "Default",
  swqosOnly: boolean = false,
  skipPreflight: boolean = true,
  mevProtect?: boolean
): Promise<Signature> => {
  const res = await fetch(senderFastUrl(region, { swqosOnly, mevProtect }), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now().toString(),
      method: "sendTransaction",
      params: [tx64, { encoding: "base64", skipPreflight, maxRetries: 0 }],
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
    `Unexpected Sender response: ${JSON.stringify(body).slice(0, 200)}`
  );
};
