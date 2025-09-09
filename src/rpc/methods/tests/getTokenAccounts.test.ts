import {
  GetTokenAccountsRequest,
  GetTokenAccountsResponse,
} from "../../../types/das";
import { createHeliusEager as createHelius } from "../../createHelius.eager";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
}));

describe("getTokenAccounts Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Fetches token accounts for Luke Skywalker", async () => {
    const mockResponse: GetTokenAccountsResponse = {
      total: 2,
      limit: 1000,
      page: 1,
      token_accounts: [
        {
          address: "account-kyber-1",
          mint: "KYBER_MINT",
          owner: "lukeskywalker.sol",
          amount: 1138,
          delegated_amount: 0,
          frozen: false,
          token_extensions: {},
        },
        {
          address: "account-credit-2",
          mint: "GALACTIC_CREDIT",
          owner: "lukeskywalker.sol",
          amount: 9000,
          delegated_amount: 0,
          frozen: false,
          token_extensions: {},
        },
      ],
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params: GetTokenAccountsRequest = {
      owner: "lukeskywalker.sol",
      page: 1,
      limit: 1000,
      options: {
        showZeroBalance: true,
      },
    };

    const result = await rpc.getTokenAccounts(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getTokenAccounts",
          params,
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
      rpc.getTokenAccounts({ owner: "palpatine.invalid" })
    ).rejects.toThrow(/Invalid params/);
  });
});
