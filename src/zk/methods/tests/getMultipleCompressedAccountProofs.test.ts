import { createHelius } from "../../../rpc";
import type { GetMultipleCompressedAccountProofsResponse } from "../../types";

const transportMock = jest.fn();
jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getMultipleCompressedAccountProofs Tests", () => {
  let helius = createHelius({ apiKey: "test-key" });

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "test-key" });
  });

  it("Fetches proofs for multiple Death Star-level secrets", async () => {
    const mockResponse: GetMultipleCompressedAccountProofsResponse = {
      context: { slot: 197700 },
      value: [
        {
          hash: "DEATH-STAR-HASH-1",
          leafIndex: 1138,
          merkleTree: "TREE-ENDOR",
          proof: ["P1", "P2"],
          root: "ROOT-ALDERAAN",
          rootSeq: 42,
        },
        {
          hash: "DEATH-STAR-HASH-2",
          leafIndex: 9000,
          merkleTree: "TREE-YAVIN",
          proof: ["P3"],
          root: "ROOT-TATOOINE",
          rootSeq: 43,
        },
      ],
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResponse,
    });

    const hashes = ["DEATH-STAR-HASH-1", "DEATH-STAR-HASH-2"];
    const res = await helius.zk.getMultipleCompressedAccountProofs(hashes);

    expect(res).toEqual(mockResponse);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getMultipleCompressedAccountProofs",
          params: hashes,
        }),
      })
    );
  });

  it("Propagates RPC errors from Imperial interceptors", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32602, message: "Invalid hash list" },
    });

    await expect(
      helius.zk.getMultipleCompressedAccountProofs(["badHash"])
    ).rejects.toThrow(/invalid hash list/i);
  });
});
