import { GetTransfersByAddressResult } from "../../../types";
import { createHeliusEager as createHelius } from "../../createHelius.eager";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
}));

describe("getTransfersByAddress Tests", () => {
  let rpc: ReturnType<typeof createHelius>;
  const address = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Fetches transfers with config (mint/direction/filters/pagination)", async () => {
    const mockResponse: GetTransfersByAddressResult = {
      data: [
        {
          signature:
            "5GEX7Q3X5Q8yJGbKYoR7mtzQmG8tpoEwzjPgqVmn3y5xg3yKwqXcDdN5YVcc9V6vA4TuH5iM6FHRVhTxvz4AX2zG",
          slot: 315073428,
          blockTime: 1736159420,
          type: "transfer",
          fromUserAccount: "7hPhaUpydpvm8wtiS3k4LPZKUmivQRs7YQmpE1hFshHx",
          toUserAccount: address,
          fromTokenAccount: "HcvK3EJ74iM9g11cUgsaPvLSrhCvCwcrWxBNd87LsC1x",
          toTokenAccount: "CBcYniR9G9CN3zGMnwNE4SWbqkYWvCFVreEob9xHnQCY",
          mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
          amount: "2500000",
          decimals: 6,
          uiAmount: "2.5",
          confirmationStatus: "finalized",
          transactionIdx: 35,
          instructionIdx: 1,
          innerInstructionIdx: 0,
        },
      ],
      paginationToken: "315073428:35:1:0",
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const result = await rpc.getTransfersByAddress([
      address,
      {
        with: "7hPhaUpydpvm8wtiS3k4LPZKUmivQRs7YQmpE1hFshHx",
        direction: "in",
        mint: "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
        solMode: "merged",
        limit: 50,
        sortOrder: "desc",
        filters: {
          amount: { gte: 1_000_000 },
          blockTime: { gte: 1736159000 },
          slot: { lte: 315073428 },
        },
      },
    ]);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getTransfersByAddress",
          params: [
            address,
            expect.objectContaining({
              direction: "in",
              limit: 50,
              filters: expect.objectContaining({
                amount: { gte: 1_000_000 },
              }),
            }),
          ],
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
      rpc.getTransfersByAddress([
        address,
        { limit: -1 }, // Invalid on purpose
      ])
    ).rejects.toThrow(/Invalid params/);

    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getTransfersByAddress",
        }),
      })
    );
  });
});
