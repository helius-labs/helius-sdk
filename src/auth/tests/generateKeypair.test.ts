import { generateKeypair } from "../generateKeypair";

describe("generateKeypair", () => {
  it("returns publicKey (32 bytes) and secretKey (64 bytes)", async () => {
    const result = await generateKeypair();

    expect(result.publicKey).toBeInstanceOf(Uint8Array);
    expect(result.secretKey).toBeInstanceOf(Uint8Array);
    expect(result.publicKey.length).toBe(32);
    expect(result.secretKey.length).toBe(64);
  });

  it("embeds publicKey in the last 32 bytes of secretKey", async () => {
    const result = await generateKeypair();

    const embeddedPubkey = result.secretKey.slice(32);
    expect(embeddedPubkey).toEqual(result.publicKey);
  });

  it("generates unique keypairs on each call", async () => {
    const a = await generateKeypair();
    const b = await generateKeypair();

    expect(a.publicKey).not.toEqual(b.publicKey);
    expect(a.secretKey).not.toEqual(b.secretKey);
  });
});
