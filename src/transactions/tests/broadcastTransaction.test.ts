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
          err: { InstructionError: [0n, { Custom: 6001n }] },
        },
      ],
    });

    const broadcast = broadcastTransactionFactory(rpc);
    // Also pins bigint-safe serialization of the kit-upcast err payload
    await expect(broadcast(TX64)).rejects.toThrow(
      /failed on-chain: .*"Custom":"6001"/
    );
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
    expect(rpc.getSignatureStatuses).toHaveBeenCalledTimes(2);
  });

  it("Resolves when the tx confirms on the re-check after expiry is first observed", async () => {
    // The tx lands at or before the expiry height while the tip moves past it,
    // so only a status read after the height read can see it
    const rpc = buildMockRpc({
      heights: [100, 102],
      statuses: [null, { confirmationStatus: "confirmed", err: null }],
    });

    const broadcast = broadcastTransactionFactory(rpc);
    await expect(
      broadcast(TX64, { pollIntervalMs: 1, pollTimeoutMs: 50 })
    ).resolves.toBe("3U9JYc3QkWeSFX36zWYD4bMFheh1J2g1AEB7B1ohRvHC");
  });

  it("Throws failed on-chain when the re-check after expiry finds an error", async () => {
    const rpc = buildMockRpc({
      heights: [100, 102],
      statuses: [
        null,
        {
          confirmationStatus: "confirmed",
          err: { InstructionError: [0n, { Custom: 6001n }] },
        },
      ],
    });

    const broadcast = broadcastTransactionFactory(rpc);
    await expect(
      broadcast(TX64, { pollIntervalMs: 1, pollTimeoutMs: 50 })
    ).rejects.toThrow(/failed on-chain/i);
  });

  it("Prefers the conclusive result over a timeout during the post-expiry re-check", async () => {
    const rpc = buildMockRpc({
      heights: [100, 102],
      statuses: [null, { confirmationStatus: "confirmed", err: null }],
    });

    const nowSpy = jest
      .spyOn(Date, "now")
      .mockReturnValueOnce(0) // started
      .mockReturnValueOnce(0) // first iteration's timeout check
      .mockReturnValue(10_000); // deadline long past for any later read

    try {
      const broadcast = broadcastTransactionFactory(rpc);
      await expect(
        broadcast(TX64, { pollIntervalMs: 1, pollTimeoutMs: 50 })
      ).resolves.toBe("3U9JYc3QkWeSFX36zWYD4bMFheh1J2g1AEB7B1ohRvHC");
    } finally {
      nowSpy.mockRestore();
    }
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
