import { createHelius } from "../../../rpc";
import { GetCompressionSignaturesForAccountResponse } from "../../types";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getCompressionSignaturesForAccount Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Returns signatures for the Tantive IV secret hash", async () => {
    const mockResponse: GetCompressionSignaturesForAccountResponse = {
      context: { slot: 42_000_000 },
      value: {
        items: [
          {
            signature: "RebelSig11111111111111111111111111111111111111",
            slot: 42_000_000,
            blockTime: 1714_081_554,
          },
        ],
      },
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params = { hash: "DeathStarPlansHash000000000000000000000" };
    const res = await helius.zk.getCompressionSignaturesForAccount(params);

    expect(res).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getCompressionSignaturesForAccount",
          params,
        }),
      })
    );
  });

  it("Bubbles up Imperial-grade errors", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Hash not found in the galaxy" },
    });

    await expect(
      helius.zk.getCompressionSignaturesForAccount({ hash: "BadHash" })
    ).rejects.toThrow(/not found/i);
  });
});
