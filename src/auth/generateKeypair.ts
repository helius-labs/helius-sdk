import nacl from "tweetnacl";

export function generateKeypair(): {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
} {
  const keypair = nacl.sign.keyPair();
  return { publicKey: keypair.publicKey, secretKey: keypair.secretKey };
}
