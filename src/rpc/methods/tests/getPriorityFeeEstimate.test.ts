import { createHeliusEager as createHelius } from "../../createHelius.eager";
import { GetPriorityFeeEstimateResponse, PriorityLevel } from "../../../types";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
}));

describe("getPriorityFeeEstimate Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Successfully fetches a priority fee estimate", async () => {
    const mockResponse: GetPriorityFeeEstimateResponse = {
      priorityFeeEstimate: 1138,
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const result = await rpc.getPriorityFeeEstimate({
      accountKeys: ["lukeskywalker.sol"],
    });

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getPriorityFeeEstimate",
          params: [{ accountKeys: ["lukeskywalker.sol"] }],
        }),
      })
    );
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

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params = {
      transaction: "base64-encoded-kyber-crystal-transaction",
      options: {
        priorityLevel: PriorityLevel.VERY_HIGH,
        includeAllPriorityFeeLevels: true,
        lookbackSlots: 10,
      },
    };

    const result = await rpc.getPriorityFeeEstimate(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getPriorityFeeEstimate",
          params: [params],
        }),
      })
    );
  });

  it("Handles RPC errors", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Invalid params" },
    });

    await expect(
      rpc.getPriorityFeeEstimate({ accountKeys: ["invalid-address"] })
    ).rejects.toThrow(/Invalid params/);
  });
});
