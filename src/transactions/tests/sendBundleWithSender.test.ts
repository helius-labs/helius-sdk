import { makeSendBundleWithSender } from "../sendBundleWithSender";

const mockPoll = jest.fn();

jest.mock("../pollTransactionConfirmation", () => ({
  makePollTransactionConfirmation:
    () =>
    (...args: any[]) =>
      mockPoll(...args),
}));

jest.mock("@solana/kit", () => {
  const actual = jest.requireActual("@solana/kit");
  return {
    ...actual,
    getBase64EncodedWireTransaction: (tx: any) => `B64:${tx.id}`,
    getSignatureFromTransaction: (tx: any) => `SIG:${tx.id}`,
  };
});

const g = global as any;

const fakeTx = (id: string, lastValidBlockHeight?: bigint): any => ({
  id,
  messageBytes: new Uint8Array(),
  signatures: {},
  ...(lastValidBlockHeight !== undefined
    ? { lifetimeConstraint: { blockhash: "bh", lastValidBlockHeight } }
    : {}),
});

describe("makeSendBundleWithSender", () => {
  const dummyRpc: any = {};

  beforeEach(() => {
    jest.resetAllMocks();
    mockPoll.mockResolvedValue(undefined);
  });

  it("POSTs sendBundle with base64-encoded txs and tracks each signature", async () => {
    let captured: any;
    g.fetch = jest.fn().mockImplementation((_url: string, init: any) => {
      captured = JSON.parse(init.body);
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ result: "bundleId" }),
      });
    });

    const { sendBundle } = makeSendBundleWithSender({ raw: dummyRpc });
    const txs = [fakeTx("a", 100n), fakeTx("b", 90n)];

    const sigs = await sendBundle(txs, { region: "US_EAST" });

    // Correct JSON-RPC shape: [[base64Tx, ...], { encoding: "base64" }]
    expect(captured.method).toBe("sendBundle");
    expect(captured.params).toEqual([
      ["B64:a", "B64:b"],
      { encoding: "base64" },
    ]);
    // Endpoint is the regional /fast host (Sender Max — no swqos_only).
    expect((g.fetch as jest.Mock).mock.calls[0][0]).toContain("/fast");
    expect((g.fetch as jest.Mock).mock.calls[0][0]).not.toContain("swqos_only");

    // Returns signatures and polls each by signature with the min lastValidBlockHeight.
    expect(sigs).toEqual(["SIG:a", "SIG:b"]);
    expect(mockPoll).toHaveBeenCalledTimes(2);
    expect(mockPoll).toHaveBeenNthCalledWith(
      1,
      "SIG:a",
      expect.objectContaining({ lastValidBlockHeight: 90n })
    );
    expect(mockPoll).toHaveBeenNthCalledWith(
      2,
      "SIG:b",
      expect.objectContaining({ lastValidBlockHeight: 90n })
    );
  });

  it("rejects an empty bundle", async () => {
    const { sendBundle } = makeSendBundleWithSender({ raw: dummyRpc });
    await expect(sendBundle([])).rejects.toThrow(/at least one transaction/i);
  });

  it("rejects more than 5 transactions", async () => {
    const { sendBundle } = makeSendBundleWithSender({ raw: dummyRpc });
    const txs = [1, 2, 3, 4, 5, 6].map((n) => fakeTx(String(n)));
    await expect(sendBundle(txs)).rejects.toThrow(/at most 5/i);
  });

  it("throws on an HTTP error", async () => {
    g.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 500,
      text: () => Promise.resolve("Internal error"),
    });
    const { sendBundle } = makeSendBundleWithSender({ raw: dummyRpc });
    await expect(sendBundle([fakeTx("a")])).rejects.toThrow(/Internal error/);
  });

  it("throws on a JSON-RPC error in the response body", async () => {
    g.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ error: { message: "bad bundle" } }),
    });
    const { sendBundle } = makeSendBundleWithSender({ raw: dummyRpc });
    await expect(sendBundle([fakeTx("a")])).rejects.toThrow(/bad bundle/);
  });
});
