import type { WalletKeypair } from "./types";

export function loadKeypair(bytes: Uint8Array): WalletKeypair {
  if (bytes.length !== 64) {
    throw new Error(
      "Invalid keypair format. Expected Uint8Array of 64 bytes (Solana CLI format)."
    );
  }

  const secretKey = bytes;
  const publicKey = bytes.slice(32);

  return { publicKey, secretKey };
}
