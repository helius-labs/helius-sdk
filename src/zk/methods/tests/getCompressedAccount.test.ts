import { createHelius } from "../../../rpc/index.js";
import {
  GetCompressedAccountRequest,
  GetCompressedAccountResponse,
} from "../../types.js";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getCompressedAccount Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "death-star-plans" });
  });

  it("Retrieves a compressed account containing the Death Star plans", async () => {
    const params: GetCompressedAccountRequest = {
      address: null,
      hash: "DeathStarSuperlaserHash",
    };

    const mockResponse: GetCompressedAccountResponse = {
      context: { slot: 1_977_197_7 },
      value: {
        hash: params.hash,
        address: null,
        data: null,
        owner: "GrandMoffTarkin1111111111111111111111111111",
        lamports: 2_000_000,
        tree: "SithHolocronMerkleTree",
        leafIndex: 1138,
        seq: 327,
        slotCreated: 1_977_000_0,
      } as any,
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const result = await helius.zk.getCompressedAccount(params);

    // The response is surfaced verbatim
    expect(result).toStrictEqual(mockResponse);

    // The underlying payload was shaped correctly
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getCompressedAccount",
          params,
        }),
      })
    );
  });

  it("Returns a null value when no account matches", async () => {
    const mockResponse: GetCompressedAccountResponse = {
      context: { slot: 0 },
      value: null,
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const result = await helius.zk.getCompressedAccount({
      address: "AlderaanWasHere1111111111111111111111111111",
    });

    expect(result.value).toBeNull();
  });

  it("Returns a null seq for an account still in a V2 tree's output queue", async () => {
    const mockResponse: GetCompressedAccountResponse = {
      context: { slot: 0 },
      value: {
        hash: "2veKUPKieajFG7yzPNGARHq7jYS1FiXcXG8P9Txhvhcn",
        address: null,
        data: null,
        owner: "J6ULJViDpQTRntYTmfkpUZZ71KTVkZNJFSDcQhFCo5Ef",
        lamports: 999_998_000,
        tree: "bmt1LryLZUMmF7ZtqESaw7wifBXLfXHQYoE4GAmrahU",
        leafIndex: 3,
        seq: null,
        slotCreated: 0,
      },
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const result = await helius.zk.getCompressedAccount({
      address: null,
      hash: "2veKUPKieajFG7yzPNGARHq7jYS1FiXcXG8P9Txhvhcn",
    });

    expect(result).toStrictEqual(mockResponse);
    expect(result.value?.seq).toBeNull();
  });

  it("Surfaces RPC errors from the dark side", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: {
        code: -32602,
        message: "These are not the Merkle leaves you are looking for",
      },
    });

    await expect(
      helius.zk.getCompressedAccount({ address: null, hash: "BadHash" })
    ).rejects.toThrow(/not the Merkle leaves/i);
  });
});
