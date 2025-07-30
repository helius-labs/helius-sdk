import { makePollTransactionConfirmation } from "../pollTransactionConfirmation";
import type { Rpc, SolanaRpcApi } from "@solana/kit";
import type { Signature } from "@solana/kit";

const buildMockRpc = (
  heights: number[],
  statuses: (null | { confirmationStatus: string; err: any })[],
): Rpc<SolanaRpcApi> => {
  let hIdx = 0;
  let sIdx = 0;

  return {
    getBlockHeight: jest.fn(() => ({
      send: () => Promise.resolve(heights[Math.min(hIdx++, heights.length - 1)]),
    })),

    getSignatureStatuses: jest.fn(() => ({
      send: () =>
        Promise.resolve({
          value: [statuses[Math.min(sIdx++, statuses.length - 1)]],
        }),
    })),
  } as unknown as Rpc<SolanaRpcApi>;
}

const SIG: Signature = "5vRXUwoFtoNHz4kxk6yNpQB8HzMvHqhZkUPrqE9xDdFJ" as Signature;

describe("pollTransactionConfirmation Tests", () => {
  it("Resolves when the signature reaches a confirmed state", async () => {
    const rpc = buildMockRpc(
      [100],
      [{ confirmationStatus: "confirmed", err: null }],
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
          err: { InstructionError: [0, "Custom"] },
        },
      ],
    );

    const poll = makePollTransactionConfirmation(rpc);
    await expect(poll(SIG)).rejects.toThrow(/failed on-chain/i);
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
      }),
    ).rejects.toThrow(/exceeded lastValidBlockHeight/i);
  });

  it("Throws when wall-clock timeout is hit", async () => {
    const rpc = buildMockRpc([100, 100, 100], [null, null, null]);

    const poll = makePollTransactionConfirmation(rpc);
    await expect(
      poll(SIG, {
        interval: 5,
        timeout: 15,
      }),
    ).rejects.toThrow(/not confirmed within/i);
  });
});
