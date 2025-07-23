import { createHelius } from "../..";
import { GetPriorityFeeEstimateResponse, PriorityLevel } from "../../../types";

const mockRequest = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn().mockReturnValue(jest.fn()),
  createRpc: jest.fn().mockImplementation(() => {
    const request = mockRequest;

    // Helper that mirrors the real one
    const getPriorityFeeEstimate = (params: any) => {
      return request("getPriorityFeeEstimate", params).then((resp: any) => {
        if (resp && resp.error) {
          throw new Error(resp.error.message ?? "RPC error");
        }
        return resp.result ?? resp;
      });
    };

    return { request, getPriorityFeeEstimate };
  }),
}));

describe("getPriorityFeeEstimate Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully fetches a priority fee estimate", async () => {
    const mockResponse: GetPriorityFeeEstimateResponse = { priorityFeeEstimate: 1138 };

    mockRequest.mockResolvedValue({ result: mockResponse });
    const result = await rpc.getPriorityFeeEstimate({ accountKeys: ["lukeskywalker.sol"] });

    expect(result).toEqual(mockResponse);
    expect(mockRequest).toHaveBeenCalledWith("getPriorityFeeEstimate", { accountKeys: ["lukeskywalker.sol"] });
  });

  it("Successfully fetches a priority fee estimate with options", async () => {
    const mockResponse: GetPriorityFeeEstimateResponse = {
      priorityFeeLevels: {
        min: 66,
        low: 1138,
        medium: 2000, 
        high: 9000,
        veryHigh: 10000,
        unsafeMax: 42069,
      },
    };

    mockRequest.mockResolvedValue({ result: mockResponse });
    const result = await rpc.getPriorityFeeEstimate({
      transaction: "base64-encoded-kyber-crystal-transaction",
      options: { priorityLevel: PriorityLevel.VERY_HIGH, includeAllPriorityFeeLevels: true, lookbackSlots: 10 },
    });

    expect(result).toEqual(mockResponse);
    expect(mockRequest).toHaveBeenCalledWith("getPriorityFeeEstimate", {
      transaction: "base64-encoded-kyber-crystal-transaction",
      options: { priorityLevel: PriorityLevel.VERY_HIGH, includeAllPriorityFeeLevels: true, lookbackSlots: 10 },
    });
  });

  it("Handles RPC errors", async () => {
    mockRequest.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Invalid params" },
    });

    await expect(rpc.getPriorityFeeEstimate({ accountKeys: ["invalid-address"] })).rejects.toThrow(/Invalid params/);
  });
});
