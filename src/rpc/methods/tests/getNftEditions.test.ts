// src/rpc/methods/tests/getNftEditions.test.ts
import type {
  Editions,
  GetNftEditionsRequest,
  GetNftEditionsResponse,
} from "../../../types/das";
import { createHeliusEager as createHelius } from "../../createHelius.eager";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
}));

describe("getNftEditions Tests", () => {
  let rpc: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    rpc = createHelius({ apiKey: "test-key" });
  });

  it("Fetches NFT editions for a master Holocron mint", async () => {
    const mockResponse: GetNftEditionsResponse = {
      total: 2,
      limit: 1000,
      page: 1,
      master_edition_address: "JEDI_MASTER_HOLOCRON_1138",
      supply: 2,
      max_supply: 1000,
      editions: [
        {
          id: "holocron-edition-1",
          mint: "holocron-mint-1",
          owner: "lukeskywalker.sol",
          edition: 1,
          burnt: false,
        } as unknown as Editions,
        {
          id: "holocron-edition-2",
          mint: "holocron-mint-2",
          owner: "ahsokatano.sol",
          edition: 2,
          burnt: false,
        } as unknown as Editions,
      ],
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const params: GetNftEditionsRequest = {
      mint: "master-holocron-mint-1138",
      page: 1,
      limit: 1000,
    };

    const result = await rpc.getNftEditions(params);

    expect(result).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getNftEditions",
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
      rpc.getNftEditions({ mint: "sith-holocron-mint-bad" })
    ).rejects.toThrow(/Invalid params/);
  });
});
