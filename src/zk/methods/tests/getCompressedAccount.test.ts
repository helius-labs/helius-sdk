import { createHelius } from "../../../rpc";
import {
  GetCompressedAccountRequest,
  GetCompressedAccountResponse,
} from "../../types";

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
