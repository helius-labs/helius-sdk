/**
 * Tests for helius.zk.getCompressedTokenAccountsByDelegate
 * Rebel‑Alliance themed.
 */
import { createHelius } from "../../../rpc";
import type { GetCompressedTokenAccountsByDelegateResponse } from "../../types";

const transportMock = jest.fn();
jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getCompressedTokenAccountsByDelegate Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Returns token accounts delegated to Mon Mothma", async () => {
    const mockResponse: GetCompressedTokenAccountsByDelegateResponse = {
      context: { slot: 7_711_198 },
      value: {
        cursor: "RebelCursor42",
        items: [
          {
            account: {
              address: "RebelAcc1111111111111111111111111111111",
              hash: "RebelHash111111111111111111111111111111",
              owner: "RebelOwner11111111111111111111111111111",
              lamports: 321,
              tree: "RebelTree11111111111111111111111111111",
              leafIndex: 5,
              seq: 10,
              slotCreated: 7000000,
              data: {
                discriminator: 0,
                data: "SGF4b3I=",
                dataHash: "DataHashRebel11111111111111111111111",
              },
            },
            tokenData: {
              amount: 321,
              delegate: "MonMothma1111111111111111111111111111",
              mint: "AllianceMint11111111111111111111111111",
              owner: "RebelOwner11111111111111111111111111111",
              state: "initialized",
              tlv: "U3RhckhvcGU=",
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

    const params = { delegate: "MonMothma1111111111111111111111111111" };
    const res = await helius.zk.getCompressedTokenAccountsByDelegate(params);

    expect(res).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getCompressedTokenAccountsByDelegate",
          params,
        }),
      })
    );
  });

  it("Bubbles up Imperial errors", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Delegate not found in the empire" },
    });

    await expect(
      helius.zk.getCompressedTokenAccountsByDelegate({
        delegate: "BadEmpireDeleg8",
      })
    ).rejects.toThrow(/delegate not found/i);
  });
});
