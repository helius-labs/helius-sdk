import { createHelius } from "../../../rpc";
import type { GetMultipleCompressedAccountsResponse } from "../../types";

const transportMock = jest.fn();
jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getMultipleCompressedAccounts Tests", () => {
  let helius = createHelius({ apiKey: "test-key" });

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Retrieves multiple Rebel intelligence files at once", async () => {
    const mockResponse: GetMultipleCompressedAccountsResponse = {
      context: { slot: 424242 },
      value: {
        items: [
          {
            address: "rebel-base-001",
            data: {
              data: "SGVsbG8sIFJlYmVscyE=", // "Hello, Rebels!"
              dataHash: "HASH1",
              discriminator: 7,
            },
            hash: "HASH1",
            lamports: 1_000_000,
            leafIndex: 123,
            owner: "MonMothmaPubkey",
            seq: 1,
            slotCreated: 420000,
            tree: "EndorTree",
          },
          null, // Second hash not found
        ],
      },
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params = {
      addresses: null,
      hashes: ["HASH1", "MISSING_HASH"],
    };

    const res = await helius.zk.getMultipleCompressedAccounts(params);

    expect(res).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getMultipleCompressedAccounts",
          params,
        }),
      })
    );
  });

  it("Surfaces RPC errors from the Empire", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Invalid request" },
    });

    await expect(
      helius.zk.getMultipleCompressedAccounts({ hashes: ["bad"] })
    ).rejects.toThrow(/invalid request/i);
  });
});
