import { address } from "@solana/kit";

import { makeGetWithdrawableAmount } from "../getWithdrawableAmount";
import { STAKE_STATE_LEN, U64_MAX } from "../types";

const stakeAccount = address("4RiZvuXvR5dr6VtUCaQhyE355sWJ5kJy7N8PwegmnPHS");

const makeAccInfo = (lamports: bigint, deactivationEpoch: bigint | string) => ({
  lamports,
  data: {
    parsed: {
      info: {
        meta: { type: "stake" },
        stake: {
          delegation: {
            deactivationEpoch: deactivationEpoch.toString(),
          },
        },
      },
    },
  },
});

const rentExemptLamports = 2_000_000n; // 0.002 SOL

const mockRpcBase = () => {
  const rpc: any = {};
  rpc.getAccountInfo = jest.fn();
  rpc.getEpochInfo = jest
    .fn()
    .mockReturnValue({ send: () => ({ epoch: 100n }) });
  rpc.getMinimumBalanceForRentExemption = jest
    .fn()
    .mockReturnValue({ send: () => rentExemptLamports });
  return rpc;
};

describe("getWithdrawableAmount Tests", () => {
  beforeEach(() => jest.clearAllMocks());

  it("Returns 0 when stake is still active", async () => {
    const rpc = mockRpcBase();
    rpc.getAccountInfo.mockReturnValue({
      send: () => ({ value: makeAccInfo(5_000_000n, U64_MAX as bigint) }),
    });

    const fn = makeGetWithdrawableAmount({ rpc });
    const amt = await fn(stakeAccount);

    expect(amt).toBe(0);
    expect(rpc.getMinimumBalanceForRentExemption).not.toHaveBeenCalled();
  });

  it("Returns lamports minus rent when inactive", async () => {
    const rpc = mockRpcBase();
    rpc.getAccountInfo.mockReturnValue({
      send: () => ({ value: makeAccInfo(5_000_000n, 80n) }), // Deactivated at epoch 80 < current 100
    });

    const fn = makeGetWithdrawableAmount({ rpc });
    const amt = await fn(stakeAccount);

    expect(rpc.getMinimumBalanceForRentExemption).toHaveBeenCalledWith(
      BigInt(STAKE_STATE_LEN)
    );
    expect(amt).toBe(Number(5_000_000n - rentExemptLamports));
  });

  it("Returns full balance when includeRentExempt = true", async () => {
    const rpc = mockRpcBase();
    rpc.getAccountInfo.mockReturnValue({
      send: () => ({ value: makeAccInfo(5_000_000n, 80n) }),
    });

    const fn = makeGetWithdrawableAmount({ rpc });
    const amt = await fn(stakeAccount, true);

    expect(amt).toBe(5_000_000);
  });
});
