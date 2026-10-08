import { sendViaSender } from "../sendViaSender";
import { signature as toSignature } from "@solana/kit";

jest.mock("@solana/kit", () => {
  const actual = jest.requireActual("@solana/kit");
  return { ...actual, signature: jest.fn((s: string) => `SIG:${s}`) };
});

const g = global as any;
const mockSignature = toSignature as jest.MockedFunction<typeof toSignature>;
const tx64 = "dGVzdA==";

describe("sendViaSender Tests", () => {
  afterEach(jest.resetAllMocks);

  it("Handles a bare-string JSON response", async () => {
    g.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve("abc123"),
    });

    const sig = await sendViaSender(tx64, "Default", false);
    expect(mockSignature).toHaveBeenCalledWith("abc123");
    expect(sig).toBe("SIG:abc123");
  });

  it("Handles JSON-RPC object response", async () => {
    g.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ result: "xyz789" }),
    });

    await sendViaSender(tx64, "EU_WEST", true);
    expect(mockSignature).toHaveBeenCalledWith("xyz789");
  });

  it("Throws nicely on an HTTP error", async () => {
    g.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal error"),
      json: () => Promise.resolve({}),
    });

    await expect(sendViaSender(tx64)).rejects.toThrow(/Internal error/);
  });

  it.each([
    [false, false, "https://sender.helius-rpc.com/fast"],
    [true, false, "https://sender.helius-rpc.com/fast?swqos_only=true"],
    [false, true, "https://sender.helius-rpc.com/fast?mev-protect=true"],
    [
      true,
      true,
      "https://sender.helius-rpc.com/fast?swqos_only=true&mev-protect=true",
    ],
  ])(
    "Builds the Sender URL (swqosOnly=%s, mevProtect=%s)",
    async (swqosOnly, mevProtect, expected) => {
      g.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ result: "sig" }),
      });

      await sendViaSender(tx64, "Default", swqosOnly, true, mevProtect);
      expect(g.fetch.mock.calls[0][0]).toBe(expected);
    }
  );
});
