import { GetTransactionsForAddressResultSignatures } from "../../../types";
import { createHeliusEager as createHelius } from "../../createHelius.eager";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
}));

describe("getTransactionsForAddress Tests", () => {
  let rpc: ReturnType<typeof createHelius>;
  const address = "Vote111111111111111111111111111111111111111";

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Fetches transactions with config (limit/sortOrder/filters)", async () => {
    const mockResponse: GetTransactionsForAddressResultSignatures = {
      data: [
        {
          signature: "5wHu1qwD7q2oogLJXZiNvf4JLpQw2gZSQWNYQEaFz8VjP1WtZkPvWZ1BZGZzJT2p",
          slot: 123456789,
          err: null,
          memo: null,
          blockTime: 1700000000,
          confirmationStatus: "finalized",
        },
        {
          signature: "3xKu2rwE8r3ppgMKYZqNwg5KMrRx3hZTRWNZRFbGy9WkQ2XuAkQvXA2CZHZaKU3q",
          slot: 123456780,
          err: null,
          memo: "test memo",
          blockTime: 1699999990,
          confirmationStatus: "finalized",
        },
      ],
      paginationToken: "next-token",
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const result = await rpc.getTransactionsForAddress([
      address,
      {
        limit: 10,
        sortOrder: "desc",
        filters: {
          status: "succeeded",
          slot: { gte: 100000000 },
        },
      },
    ]);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getTransactionsForAddress",
        }),
      })
    );
  });

  it("Fetches the next page using the paginationToken", async () => {
    const firstPage: GetTransactionsForAddressResultSignatures = {
      data: [
        {
          signature: "first-sig",
          slot: 100,
          err: null,
          memo: null,
          blockTime: 1700000000,
          confirmationStatus: "finalized",
        },
      ],
      paginationToken: "token-1",
    };
    const secondPage: GetTransactionsForAddressResultSignatures = {
      data: [
        {
          signature: "second-sig",
          slot: 99,
          err: null,
          memo: null,
          blockTime: 1699999990,
          confirmationStatus: "finalized",
        },
      ],
      paginationToken: null,
    };

    // First call returns first page
    transportMock.mockResolvedValueOnce({
      jsonrpc: "2.0",
      id: "1",
      result: firstPage,
    });

    // Second call returns second page
    transportMock.mockResolvedValueOnce({
      jsonrpc: "2.0",
      id: "1",
      result: secondPage,
    });

    const res1 = await rpc.getTransactionsForAddress([
      address,
      { limit: 1, sortOrder: "desc" },
    ]);
    expect(res1).toEqual(firstPage);

    const res2 = await rpc.getTransactionsForAddress([
      address,
      { limit: 1, paginationToken: res1.paginationToken! },
    ]);
    expect(res2).toEqual(secondPage);

    // Verify the second call carried the token through
    expect(transportMock).toHaveBeenLastCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getTransactionsForAddress",
          params: [address, { limit: 1, paginationToken: "token-1" }],
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
      rpc.getTransactionsForAddress([
        address,
        { limit: -1 }, // Invalid on purpose
      ])
    ).rejects.toThrow(/Invalid params/);

    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getTransactionsForAddress",
        }),
      })
    );
  });
});
