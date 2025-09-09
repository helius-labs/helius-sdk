import { createHelius } from "../../../rpc";
import {
  GetCompressedTokenAccountsByOwnerResponse,
  CompressedAccount,
} from "../../types";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getCompressedTokenAccountsByOwner Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Returns Luke Skywalker's token accounts", async () => {
    const mockAccount: CompressedAccount = {
      address: "LukeWallet1111111111111111111111111111111",
      data: {
        data: "U2hhZmZsZXMgb2YgdGhlIEZvcmNl",
        dataHash: "HashOfBlueSaber",
        discriminator: 66,
      },
      hash: "HashOfBlueSaber",
      lamports: 100,
      leafIndex: 77,
      owner: "TokenProgram11111111111111111111111111",
      seq: 1,
      slotCreated: 1_000_000,
      tree: "SaberTree11111111111111111111111111111",
    };

    const mockResponse: GetCompressedTokenAccountsByOwnerResponse = {
      context: { slot: 12_345_678 },
      value: {
        cursor: "DagobahCursor",
        items: [
          {
            account: mockAccount,
            tokenData: {
              amount: 1,
              mint: "BlueSaberMint11111111111111111111111",
              owner: "LukeWallet1111111111111111111111111111111",
              state: "initialized",
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

    const params = { owner: "LukeWallet1111111111111111111111111111111" };
    const result = await helius.zk.getCompressedTokenAccountsByOwner(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getCompressedTokenAccountsByOwner",
          params,
        }),
      })
    );
  });

  it("Propagates RPC errors from the Dark Side", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: {
        code: -32602,
        message: "These are not the tokens you're looking for",
      },
    });

    await expect(
      helius.zk.getCompressedTokenAccountsByOwner({
        owner: "ImperialWallet0000000000000000000000",
      })
    ).rejects.toThrow(/not the tokens/i);
  });
});
