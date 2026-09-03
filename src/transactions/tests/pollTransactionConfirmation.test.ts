import { makePollTransactionConfirmation } from "../pollTransactionConfirmation";
import type { Rpc, SolanaRpcApi } from "@solana/kit";
import type { Signature } from "@solana/kit";

const buildMockRpc = (
  heights: number[],
  statuses: (null | { confirmationStatus: string; err: any })[]
): Rpc<SolanaRpcApi> => {
  let hIdx = 0;
  let sIdx = 0;

  return {
    getBlockHeight: jest.fn(() => ({
      send: () =>
        Promise.resolve(heights[Math.min(hIdx++, heights.length - 1)]),
    })),

    getSignatureStatuses: jest.fn(() => ({
      send: () =>
        Promise.resolve({
          value: [statuses[Math.min(sIdx++, statuses.length - 1)]],
        }),
    })),
  } as unknown as Rpc<SolanaRpcApi>;
};

const SIG: Signature =
  "5vRXUwoFtoNHz4kxk6yNpQB8HzMvHqhZkUPrqE9xDdFJ" as Signature;

describe("pollTransactionConfirmation Tests", () => {
  it("Resolves when the signature reaches a confirmed state", async () => {
    const rpc = buildMockRpc(
      [100],
      [{ confirmationStatus: "confirmed", err: null }]
    );

    const poll = makePollTransactionConfirmation(rpc);
    await expect(poll(SIG)).resolves.toBe(SIG);

    // Only one status fetch needed
    expect(rpc.getSignatureStatuses).toHaveBeenCalledTimes(1);
  });

  it("Throws when on-chain status contains an error", async () => {
    const rpc = buildMockRpc(
      [100],
      [
        {
          confirmationStatus: "confirmed",
          err: { InstructionError: [0n, { Custom: 6001n }] },
        },
      ]
    );

    const poll = makePollTransactionConfirmation(rpc);
    // Also pins bigint-safe serialization of the kit-upcast err payload
    await expect(poll(SIG)).rejects.toThrow(
      /failed on-chain: .*"Custom":"6001"/
    );
  });

  it("Throws when block height exceeds lastValidBlockHeight", async () => {
    // Heights rise: 100 → 102, and status stays null
    const rpc = buildMockRpc([100, 101, 102], [null, null, null]);

    const poll = makePollTransactionConfirmation(rpc);
    await expect(
      poll(SIG, {
        interval: 1,
        timeout: 50,
        lastValidBlockHeight: 101,
      })
    ).rejects.toThrow(/exceeded lastValidBlockHeight/i);
  });

  it("Throws when the tx failed on-chain even if block height exceeded lastValidBlockHeight", async () => {
    // Heights rise past lastValidBlockHeight, and the final status check finds
    // the tx confirmed but with an on-chain error
    const rpc = buildMockRpc(
      [100, 102],
      [
        {
          confirmationStatus: "confirmed",
          err: { InstructionError: [0n, { Custom: 6001n }] },
        },
      ]
    );

    const poll = makePollTransactionConfirmation(rpc);
    await expect(
      poll(SIG, {
        interval: 1,
        timeout: 50,
        lastValidBlockHeight: 101,
      })
    ).rejects.toThrow(/failed on-chain/i);
  });

  it("Throws failed on-chain (not expiry) for a processed status with an error", async () => {
    // err takes precedence over the expiry classification even when the
    // status has not yet reached a commitment in confirmationStatuses
    const rpc = buildMockRpc(
      [100, 102],
      [
        {
          confirmationStatus: "processed",
          err: { InstructionError: [0n, { Custom: 6001n }] },
        },
      ]
    );

    const poll = makePollTransactionConfirmation(rpc);
    await expect(
      poll(SIG, {
        interval: 1,
        timeout: 50,
        lastValidBlockHeight: 101,
      })
    ).rejects.toThrow(/failed on-chain/i);
  });

  it("Resolves when the tx confirmed cleanly even if block height exceeded lastValidBlockHeight", async () => {
    const rpc = buildMockRpc(
      [100, 102],
      [{ confirmationStatus: "confirmed", err: null }]
    );

    const poll = makePollTransactionConfirmation(rpc);
    await expect(
      poll(SIG, {
        interval: 1,
        timeout: 50,
        lastValidBlockHeight: 101,
      })
    ).resolves.toBe(SIG);

    // Resolved from the first status decode, before any expiry classification
    expect(rpc.getSignatureStatuses).toHaveBeenCalledTimes(1);
  });

  it("Resolves when the tx confirms on the re-check after expiry is first observed", async () => {
    // Expiry observed with an inconclusive status must trigger one final,
    // fresher status read before the expiry error is thrown
    const rpc = buildMockRpc(
      [100, 102],
      [null, { confirmationStatus: "confirmed", err: null }]
    );

    const poll = makePollTransactionConfirmation(rpc);
    await expect(
      poll(SIG, {
        interval: 1,
        timeout: 50,
        lastValidBlockHeight: 101,
      })
    ).resolves.toBe(SIG);

    expect(rpc.getSignatureStatuses).toHaveBeenCalledTimes(2);
  });

  it("Prefers the conclusive result over a timeout during the post-expiry re-check", async () => {
    // Wall clock expires between observing expiry and the final status read;
    // the terminal read still runs so the caller gets the real outcome
    const rpc = buildMockRpc(
      [100, 102],
      [null, { confirmationStatus: "confirmed", err: null }]
    );

    const nowSpy = jest
      .spyOn(Date, "now")
      .mockReturnValueOnce(0) // started
      .mockReturnValueOnce(0) // first iteration's timeout check
      .mockReturnValue(10_000); // deadline long past for any later read

    try {
      const poll = makePollTransactionConfirmation(rpc);
      await expect(
        poll(SIG, {
          interval: 1,
          timeout: 50,
          lastValidBlockHeight: 101,
        })
      ).resolves.toBe(SIG);
    } finally {
      nowSpy.mockRestore();
    }
  });

  it("Throws when wall-clock timeout is hit", async () => {
    const rpc = buildMockRpc([100, 100, 100], [null, null, null]);

    const poll = makePollTransactionConfirmation(rpc);
    await expect(
      poll(SIG, {
        interval: 5,
        timeout: 15,
      })
    ).rejects.toThrow(/not confirmed within/i);
  });
});
