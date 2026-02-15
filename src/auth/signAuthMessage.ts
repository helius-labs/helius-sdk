import nacl from "tweetnacl";
import bs58 from "bs58";

export function signAuthMessage(secretKey: Uint8Array): {
  message: string;
  signature: string;
} {
  const message = JSON.stringify({
    message:
      "Please sign this message to verify ownership of your wallet and connect to Helius.",
    timestamp: Date.now(),
  });

  const messageBytes = new TextEncoder().encode(message);
  const signatureBytes = nacl.sign.detached(messageBytes, secretKey);
  const signature = bs58.encode(signatureBytes);

  return { message, signature };
}
