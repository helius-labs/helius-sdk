import { createHelius } from "../../../rpc";
import {
  AddressWithTree,
  CompressedProofWithContext,
  GetValidityProofResponse,
} from "../../types";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getValidityProof Tests", () => {
  let helius: ReturnType<typeof createHelius>;

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "ROGUE-ONE-KEY" });
  });

  it("Returns a valid single proof for Death Star plans", async () => {
    const addrWithTree: AddressWithTree = {
      address: "RebelBaseYavinIV111111111111111111111",
      tree: "GreatTempleTree111111111111111111111",
    };

    const proofPayload: CompressedProofWithContext = {
      compressedProof: { a: "0xAa", b: "0xBb", c: "0xCc" },
      leafIndices: [0],
      leaves: ["LeafHash_0"],
      merkleTrees: [addrWithTree.tree],
      rootIndices: [0n],
      roots: ["RootHash_0"],
    };

    const mockResp: GetValidityProofResponse = {
      context: { slot: 505_202 },
      value: proofPayload,
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResp,
    });

    const result = await helius.zk.getValidityProof({
      newAddressesWithTrees: [addrWithTree],
    });

    expect(result).toEqual(mockResp);
    expect(result.value.compressedProof.a).toMatch(/0xAa/);
    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getValidityProof",
          params: { newAddressesWithTrees: [addrWithTree] },
        }),
      })
    );
  });

  it("Works when only hashes are supplied (i.e., no new addresses)", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: {
        context: { slot: 777 },
        value: {
          compressedProof: { a: "0x1", b: "0x2", c: "0x3" },
          leafIndices: [7],
          leaves: ["Leaf7"],
          merkleTrees: ["AnyTree"],
          rootIndices: [7],
          roots: ["Root7"],
        },
      },
    });

    const res = await helius.zk.getValidityProof({
      hashes: ["Hash_Emperor_Palpatine"],
    });

    expect(res.value.leafIndices[0]).toBe(7);
  });

  it("Surfaces Sith-level RPC errors", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: {
        code: -32602,
        message: "The dark side clouds everything",
      },
    });

    await expect(
      helius.zk.getValidityProof({
        hashes: ["BadHash"],
      })
    ).rejects.toThrow(/dark side/i);
  });
});
