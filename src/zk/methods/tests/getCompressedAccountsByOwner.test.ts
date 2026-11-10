import { createHelius } from "../../../rpc/index.js";
import type { GetCompressedAccountsByOwnerResponse } from "../../types.js";

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

  it("Accepts V1 and V2 tree accounts in the same page", async () => {
    const mockResponse: GetCompressedAccountsByOwnerResponse = {
      context: { slot: 0 },
      value: {
        items: [
          {
            address: null,
            data: null,
            hash: "2veKUPKieajFG7yzPNGARHq7jYS1FiXcXG8P9Txhvhcn",
            lamports: 1_000_000,
            leafIndex: 4,
            owner: "J6ULJViDpQTRntYTmfkpUZZ71KTVkZNJFSDcQhFCo5Ef",
            seq: 4,
            slotCreated: 0,
            tree: "smt1NamzXdq4AMqS2fS2F1i5KTYPZRhoHgWx38d8WsT",
          },
          {
            address: null,
            data: null,
            hash: "JReC6h68m3EdCKP7S35e7BE4pBPwQz1HfjUkboeQy9r",
            lamports: 999_998_000,
            leafIndex: 3,
            owner: "J6ULJViDpQTRntYTmfkpUZZ71KTVkZNJFSDcQhFCo5Ef",
            seq: null,
            slotCreated: 0,
            tree: "bmt1LryLZUMmF7ZtqESaw7wifBXLfXHQYoE4GAmrahU",
          },
        ],
      },
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const result = await helius.zk.getCompressedAccountsByOwner({
      owner: "J6ULJViDpQTRntYTmfkpUZZ71KTVkZNJFSDcQhFCo5Ef",
    });

    expect(result).toEqual(mockResponse);
    expect(result.value.items.map((account) => account.seq)).toEqual([4, null]);
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
