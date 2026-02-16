import { loadKeypair } from "../loadKeypair";

describe("loadKeypair", () => {
  it("returns publicKey and secretKey from 64-byte input", () => {
    const bytes = new Uint8Array(64);
    bytes.fill(1, 0, 32); // seed
    bytes.fill(2, 32, 64); // public key

    const result = loadKeypair(bytes);

    expect(result.secretKey).toBe(bytes);
    expect(result.secretKey.length).toBe(64);
    expect(result.publicKey).toEqual(bytes.slice(32));
    expect(result.publicKey.length).toBe(32);
  });

  it("throws on invalid length", () => {
    expect(() => loadKeypair(new Uint8Array(32))).toThrow(
      "Invalid keypair format. Expected Uint8Array of 64 bytes (Solana CLI format)."
    );
  });

  it("throws on empty input", () => {
    expect(() => loadKeypair(new Uint8Array(0))).toThrow(
      "Invalid keypair format"
    );
  });
});
