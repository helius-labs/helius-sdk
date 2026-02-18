import { signAuthMessage } from "../signAuthMessage";
import { generateKeypair } from "../generateKeypair";

describe("signAuthMessage", () => {
  it("returns a message and base58 signature", async () => {
    const { secretKey } = await generateKeypair();
    const result = await signAuthMessage(secretKey);

    expect(typeof result.message).toBe("string");
    expect(typeof result.signature).toBe("string");
    expect(result.signature.length).toBeGreaterThan(0);
  });

  it("message contains the expected verification text", async () => {
    const { secretKey } = await generateKeypair();
    const result = await signAuthMessage(secretKey);

    const parsed = JSON.parse(result.message);
    expect(parsed.message).toBe(
      "Please sign this message to verify ownership of your wallet and connect to Helius."
    );
    expect(typeof parsed.timestamp).toBe("number");
  });

  it("produces different signatures for different calls (timestamp differs)", async () => {
    const { secretKey } = await generateKeypair();

    const a = await signAuthMessage(secretKey);
    // small delay to ensure different timestamp
    await new Promise((r) => setTimeout(r, 5));
    const b = await signAuthMessage(secretKey);

    expect(a.signature).not.toBe(b.signature);
    expect(a.message).not.toBe(b.message);
  });
});
