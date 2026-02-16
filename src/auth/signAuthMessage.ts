import { createKeyPairSignerFromBytes } from "@solana/kit";
import bs58 from "bs58";

export async function signAuthMessage(secretKey: Uint8Array): Promise<{
  message: string;
  signature: string;
}> {
  const message = JSON.stringify({
    message:
      "Please sign this message to verify ownership of your wallet and connect to Helius.",
    timestamp: Date.now(),
  });

  const signer = await createKeyPairSignerFromBytes(secretKey);
  const messageBytes = new TextEncoder().encode(message);

  const signatureBuffer = await crypto.subtle.sign(
    "Ed25519",
    signer.keyPair.privateKey,
    messageBytes
  );
  const signature = bs58.encode(new Uint8Array(signatureBuffer));

  return { message, signature };
}
