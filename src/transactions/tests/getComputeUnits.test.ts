import { makeGetComputeUnits } from "../getComputeUnits";
import type {
  BaseTransactionMessage,
  TransactionMessageWithFeePayer,
} from "@solana/kit";

/**
 * We sub out @solana-program/compute-budget so that:
 *   estimateComputeUnitLimitFactory({ rpc }) ➜ mockEstimateFn
 */
const mockEstimate = jest.fn();

jest.mock("@solana-program/compute-budget", () => ({
  estimateComputeUnitLimitFactory: () => mockEstimate,
}));

// A dummy "rpc" that satisfies the type but is never called because of the sub
const dummyRpc: any = {};

// A minimal, compilable tx‑message object (i.e., instructions + version)
const dummyMessage: BaseTransactionMessage & TransactionMessageWithFeePayer = {
  instructions: [],
  version: 0,
} as any;

describe("getComputeUnits Tests", () => {
  beforeEach(() => mockEstimate.mockReset());

  it("Applies default min (1000) and 10% buffer", async () => {
    mockEstimate.mockResolvedValueOnce(5000n);

    const getComputeUnits = makeGetComputeUnits(dummyRpc);
    const result = await getComputeUnits(dummyMessage);

    // 5000 * 1.1 = 5500
    expect(result).toBe(5500);
    expect(mockEstimate).toHaveBeenCalledWith(dummyMessage);
  });

  it("Respects custom min + bufferPct options", async () => {
    mockEstimate.mockResolvedValueOnce(3000); // Plain number should also be ok

    const getComputeUnits = makeGetComputeUnits(dummyRpc);
    const result = await getComputeUnits(dummyMessage, {
      min: 2000,
      bufferPct: 0.2, // 20 %
    });

    // ceil(3000 * 1.2) = 3600  (i.e., greater than the 2k min)
    expect(result).toBe(3600);
  });

  it("Falls back to min when estimate is extremely low", async () => {
    mockEstimate.mockResolvedValueOnce(100);

    const getComputeUnits = makeGetComputeUnits(dummyRpc);
    const result = await getComputeUnits(dummyMessage, {
      min: 1500,
      bufferPct: 0.1,
    });

    // 100 * 1.1 = 110 is lower than min, so result === min
    expect(result).toBe(1500);
  });
});
