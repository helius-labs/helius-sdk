import { determineTipSol } from "../determineTip";
import * as tipFloor from "../fetchTipFloor";
import * as lamportsUtil from "../lamports";
import { MIN_TIP_LAMPORTS_MAX, MIN_TIP_LAMPORTS_SWQOS } from "../types";

jest.mock("../fetchTipFloor");
jest.mock("../lamports");

const fetchTipFloor75th = tipFloor.fetchTipFloor75th as jest.MockedFunction<
  typeof tipFloor.fetchTipFloor75th
>;
const solToLamports = lamportsUtil.solToLamports as jest.MockedFunction<
  typeof lamportsUtil.solToLamports
>;

describe("determineTipSol Tests", () => {
  beforeEach(jest.resetAllMocks);

  it("Uses fetched tip floor when higher than the Sender Max minimum", async () => {
    fetchTipFloor75th.mockResolvedValue(0.002); // 0.002 SOL
    solToLamports.mockReturnValue(2_000_000n);

    const res = await determineTipSol(false);

    expect(res).toBe(2_000_000n);
    expect(solToLamports).toHaveBeenCalledWith(0.002);
  });

  it("Floors to the Sender Max minimum (0.001 SOL) when the floor is lower", async () => {
    fetchTipFloor75th.mockResolvedValue(0.0001); // below 0.001 SOL
    solToLamports.mockReturnValue(100_000n);

    const res = await determineTipSol(false);

    expect(res).toBe(MIN_TIP_LAMPORTS_MAX); // 1_000_000n
  });

  it("Floors to the SWQOS-only minimum (0.000005 SOL)", async () => {
    fetchTipFloor75th.mockResolvedValue(0.000001); // below 0.000005 SOL
    solToLamports.mockReturnValue(1_000n);

    const res = await determineTipSol(true);

    expect(res).toBe(MIN_TIP_LAMPORTS_SWQOS); // 5_000n
  });

  it("Falls back to the Sender Max minimum when the floor fetch fails", async () => {
    fetchTipFloor75th.mockResolvedValue(undefined);

    const res = await determineTipSol(false);

    expect(res).toBe(MIN_TIP_LAMPORTS_MAX); // 1_000_000n
    expect(solToLamports).not.toHaveBeenCalled();
  });
});
