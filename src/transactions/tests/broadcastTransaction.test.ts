import { broadcastTransactionFactory } from "../broadcastTransaction";
import type { Rpc, SolanaRpcApi } from "@solana/kit";
import type { Signature } from "@solana/kit";

// I think I might like this style better than what we were doing for the other tests
const buildMockRpc = (cfg: {
  heights: number[];
  statuses: (null | { confirmationStatus: string; err: any })[];
}): Rpc<SolanaRpcApi> => {
  let h = 0;
  let s = 0;

  return {
    sendTransaction: jest.fn(() => ({
      send: () =>
        Promise.resolve(
          "3U9JYc3QkWeSFX36zWYD4bMFheh1J2g1AEB7B1ohRvHC" as Signature
        ),
    })),

    getLatestBlockhash: jest.fn(() => ({
      send: () =>
        Promise.resolve({
          value: { lastValidBlockHeight: BigInt(101) },
        }),
    })),

    getBlockHeight: jest.fn(() => ({
      send: () =>
        Promise.resolve(cfg.heights[Math.min(h++, cfg.heights.length - 1)]),
    })),

    getSignatureStatuses: jest.fn(() => ({
      send: () =>
        Promise.resolve({
          value: [cfg.statuses[Math.min(s++, cfg.statuses.length - 1)]],
        }),
    })),
  } as unknown as Rpc<SolanaRpcApi>;
};

// Any base64 text is good
const TX64 = "AAAA";

describe("broadcastTransaction Tests", () => {
  it("Resolves when the signature is confirmed", async () => {
    const rpc = buildMockRpc({
      heights: [100, 100],
      statuses: [null, { confirmationStatus: "confirmed", err: null }],
    });

    const broadcast = broadcastTransactionFactory(rpc);
    const sig = await broadcast(TX64, { pollIntervalMs: 1 });

    expect(sig).toMatch(/[1-9A-HJ-NP-Za-km-z]{32,88}/);
    expect(rpc.sendTransaction).toHaveBeenCalled();
  });

  it("Throws when the status contains an on-chain error", async () => {
    const rpc = buildMockRpc({
      heights: [100],
      statuses: [
        {
          confirmationStatus: "confirmed",
          err: { InstructionError: [0, "Custom"] },
        },
      ],
    });

    const broadcast = broadcastTransactionFactory(rpc);
    await expect(broadcast(TX64)).rejects.toThrow(/failed on-chain/i);
  });

  it("Throws when the block height exceeds lastValidBlockHeight", async () => {
    const rpc = buildMockRpc({
      heights: [100, 102],
      statuses: [null, null],
    });

    const broadcast = broadcastTransactionFactory(rpc);
    await expect(
      broadcast(TX64, { pollIntervalMs: 1, pollTimeoutMs: 50 })
    ).rejects.toThrow(/failed to land on-chain/i);
  });

  it("Throws on wall-clock timeout", async () => {
    const rpc = buildMockRpc({
      heights: [100, 100, 100, 100],
      statuses: [null, null, null, null],
    });

    const broadcast = broadcastTransactionFactory(rpc);
    await expect(
      broadcast(TX64, { pollIntervalMs: 5, pollTimeoutMs: 20 })
    ).rejects.toThrow(/timed-out/i);
  });

  it("Rejects a negative lastValidBlockHeightOffset", async () => {
    const rpc = buildMockRpc({
      heights: [100],
      statuses: [null],
    });

    const broadcast = broadcastTransactionFactory(rpc);
    await expect(
      broadcast(TX64, { lastValidBlockHeightOffset: -1 })
    ).rejects.toThrow(/must be a positive number/i);
  });
});
