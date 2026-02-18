import {
  GetSignaturesForAssetRequest,
  GetSignaturesForAssetResponse,
} from "../../../types/das";
import { createHeliusEager as createHelius } from "../../createHelius.eager";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
}));

describe("getSignaturesForAsset Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Fetches signatures that touched a Kyber crystal asset", async () => {
    const mockResponse: GetSignaturesForAssetResponse = {
      total: 2,
      limit: 1000,
      page: 1,
      items: [
        ["0xORDER66", "Execute"],
        ["0xKYBER1138", "Transfer"],
      ],
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params: GetSignaturesForAssetRequest = {
      id: "kyber-crystal-asset-id",
      page: 1,
      limit: 1000,
    };

    const result = await rpc.getSignaturesForAsset(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getSignaturesForAsset",
          params,
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
      rpc.getSignaturesForAsset({ id: "not-a-real-asset", page: 1 })
    ).rejects.toThrow(/Invalid params/);
  });
});
