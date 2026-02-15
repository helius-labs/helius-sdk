import { createKeyPairSignerFromBytes } from "@solana/kit";
import type { WalletKeypair } from "./types";

export async function getAddress(keypair: WalletKeypair): Promise<string> {
  const signer = await createKeyPairSignerFromBytes(keypair.secretKey);
  return signer.address;
}
