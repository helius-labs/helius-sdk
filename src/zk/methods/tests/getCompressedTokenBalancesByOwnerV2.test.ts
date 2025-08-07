import { createHelius } from "../../../rpc";
import {
  GetCompressedTokenBalancesByOwnerV2Response,
} from "../../types";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getCompressedTokenBalancesByOwnerV2 Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "testkey" });
  });

  it("Lists Princess Leia's encrypted Alderaanian bonds (V2)", async () => {
    const mockResponse: GetCompressedTokenBalancesByOwnerV2Response = {
      context: { slot: 4_015_197 },
      value: {
        cursor: "AlderaanCursor",
        items: [
          {
            mint: "HopeMint1111111111111111111111111111111",
            balance: 1977,
          },
        ],
      },
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params = { owner: "OrganaWallet11111111111111111111111" };
    const res = await helius.zk.getCompressedTokenBalancesByOwnerV2(params);

    expect(res).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getCompressedTokenBalancesByOwnerV2",
          params,
        }),
      }),
    );
  });

  it("Propagates Sith-spawn RPC errors", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32004, message: "Planet destroyed" },
    });

    await expect(
      helius.zk.getCompressedTokenBalancesByOwnerV2({
        owner: "AlderaanRubble00000000000000000000",
      }),
    ).rejects.toThrow(/Planet destroyed/i);
  });
});
