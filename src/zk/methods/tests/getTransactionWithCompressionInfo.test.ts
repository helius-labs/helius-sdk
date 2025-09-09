import { createHelius } from "../../../rpc";
import { GetTransactionWithCompressionInfoResponse } from "../../types";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getTransactionWithCompressionInfo Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "REBEL-ALLIANCE-KEY" });
  });

  it("Returns accounts that Master Yoda opens and closes in the same tx", async () => {
    const mockResponse: GetTransactionWithCompressionInfoResponse = {
      compression_info: {
        closedAccounts: [
          {
            account: {
              address: "YodaOldHut111111111111111111111111111111",
              data: {
                data: "SGVsbG8sIERhZ29iYWg=",
                dataHash: "OldHutHash11111111111111111111111111111",
                discriminator: 66,
              },
              hash: "OldHutHash11111111111111111111111111111",
              lamports: 32768,
              leafIndex: 900,
              owner: "DagobahProgram1111111111111111111111111",
              seq: 1,
              slotCreated: 424242,
              tree: "DagobahTree111111111111111111111111111",
            },
            optionalTokenData: {
              amount: 1,
              mint: "MIDIchlorians11111111111111111111111111",
              owner: "Yoda",
              state: "frozen",
            },
          },
        ],
        openedAccounts: [
          {
            account: {
              address: "YodaJediTempleResidence222222222222222",
              data: {
                data: "SGVsbG8sIENvcnVzY2FudA==",
                dataHash: "NewHomeHash222222222222222222222222222",
                discriminator: 99,
              },
              hash: "NewHomeHash222222222222222222222222222",
              lamports: 65536,
              leafIndex: 901,
              owner: "CoruscantProgram2222222222222222222222",
              seq: 1,
              slotCreated: 424243,
              tree: "CoruscantTree2222222222222222222222222",
            },
            // No token data; this is a plain system account
          },
        ],
      },
      transaction: { slot: 987654, signatures: ["Master-Yoda-Tx-Sig"] },
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params = { signature: "Master-Yoda-Tx-Sig" };
    const result = await helius.zk.getTransactionWithCompressionInfo(params);

    expect(result).toEqual(mockResponse);
    expect(result.compression_info.closedAccounts).toHaveLength(1);
    expect(result.compression_info.openedAccounts).toHaveLength(1);

    const closed = result.compression_info.closedAccounts[0];
    expect(closed.account.owner).toMatch(/DagobahProgram/);

    const opened = result.compression_info.openedAccounts[0];
    expect(opened.account.address).toMatch(/JediTempleResidence/);

    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getTransactionWithCompressionInfo",
          params,
        }),
      })
    );
  });

  it("Handles the edge case where no compression activity occurred", async () => {
    const mockResponse: GetTransactionWithCompressionInfoResponse = {
      compression_info: {
        closedAccounts: [],
        openedAccounts: [],
      },
      transaction: { slot: 1138 },
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const bare = await helius.zk.getTransactionWithCompressionInfo({
      signature: "Boring-Bank-Tx",
    });

    expect(bare.compression_info.closedAccounts).toHaveLength(0);
    expect(bare.compression_info.openedAccounts).toHaveLength(0);
  });

  it("Surfaces RPC errors", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: {
        code: -32000,
        message: "These are not the blocks you're looking for",
      },
    });

    await expect(
      helius.zk.getTransactionWithCompressionInfo({ signature: "BadSig" })
    ).rejects.toThrow(/not the blocks/i);
  });
});
