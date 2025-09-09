import { createHelius } from "../../../rpc";
import type { GetCompressedAccountsByOwnerResponse } from "../../types";

const transportMock = jest.fn();
jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getCompressedAccountsByOwner Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Returns Luke Skywalker's compressed accounts", async () => {
    const mockResponse: GetCompressedAccountsByOwnerResponse = {
      context: { slot: 1977 },
      value: {
        cursor: "next-page-cursor",
        items: [
          {
            address: "D4thV4d3rWasMyDad11111111111111111111111",
            hash: "HashOfBlueLightsaberPlans",
            lamports: 42,
            leafIndex: 327,
            owner: "FarmBoyTatooinePubkey",
            seq: 1,
            slotCreated: 123456,
            tree: "BinaryMoistureVaporatorTree",
            data: {
              discriminator: 66,
              data: "SGVscCBtZSBPYnkgV2FuIEtlbm9iaQ==", // "Help me Obi Wan Kenobi"
              dataHash: "hashOfLeiaMessage",
            },
          },
        ],
      },
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params = { owner: "FarmBoyTatooinePubkey", limit: 1 };
    const result = await helius.zk.getCompressedAccountsByOwner(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getCompressedAccountsByOwner",
          params,
        }),
      })
    );
  });

  it("Propagates RPC errors from the Empire", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Rebel scum not authorised" },
    });

    await expect(
      helius.zk.getCompressedAccountsByOwner({ owner: "UnknownJedi" })
    ).rejects.toThrow(/Rebel scum/i);
  });
});
