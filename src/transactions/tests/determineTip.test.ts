import { determineTipSol } from "../determineTip";
import * as tipFloor from "../fetchTipFloor";
import * as lamportsUtil from "../lamports";

jest.mock("../fetchTipFloor");
jest.mock("../lamports");

const fetchTipFloor75th =
  tipFloor.fetchTipFloor75th as jest.MockedFunction<typeof tipFloor.fetchTipFloor75th>;
const solToLamports =
  lamportsUtil.solToLamports as jest.MockedFunction<typeof lamportsUtil.solToLamports>;

describe("determineTipSol Tests", () => {
  beforeEach(jest.resetAllMocks);

  it("Uses fetched tip floor when higher than Sender minimum", async () => {
    fetchTipFloor75th.mockResolvedValue(0.002);   // 0.002 SOL
    solToLamports.mockReturnValue(2_000_000n);

    const res = await determineTipSol(false);

    expect(res).toBe(2_000_000n);
    expect(solToLamports).toHaveBeenCalledWith(0.002);
  });

  it("Floors to 0.0005 SOL for SWQoS routes", async () => {
    fetchTipFloor75th.mockResolvedValue(0.0001);
    solToLamports.mockReturnValue(500_000n);      // min for SWQoS

    const res = await determineTipSol(true);

    expect(res).toBe(500_000n);
    expect(solToLamports).toHaveBeenCalledWith(0.0005);
  });

  it("Falls back to dual-route minimum when fetch fails", async () => {
    fetchTipFloor75th.mockResolvedValue(undefined);
    solToLamports.mockReturnValue(1_000_000n);    // 0.001 SOL

    const res = await determineTipSol(false);

    expect(res).toBe(1_000_000n);
    expect(solToLamports).toHaveBeenCalledWith(0.001);
  });
});
