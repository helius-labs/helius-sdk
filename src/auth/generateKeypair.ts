export async function generateKeypair(): Promise<{
  publicKey: Uint8Array;
  secretKey: Uint8Array;
}> {
  const keyPair = await crypto.subtle.generateKey("Ed25519", true, [
    "sign",
    "verify",
  ]);

  const publicKey = new Uint8Array(
    await crypto.subtle.exportKey("raw", keyPair.publicKey)
  );
  const pkcs8 = new Uint8Array(
    await crypto.subtle.exportKey("pkcs8", keyPair.privateKey)
  );

  // Ed25519 PKCS8: 16-byte ASN.1 header followed by 32-byte seed
  const seed = pkcs8.slice(-32);

  // Solana keypair format: [32-byte seed | 32-byte public key]
  const secretKey = new Uint8Array(64);
  secretKey.set(seed);
  secretKey.set(publicKey, 32);

  return { publicKey, secretKey };
}
