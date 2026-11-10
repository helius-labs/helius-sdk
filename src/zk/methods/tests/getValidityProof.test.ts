import { createHelius } from "../../../rpc/index.js";
import {
  AddressWithTree,
  CompressedProofWithContext,
  GetValidityProofResponse,
} from "../../types.js";

const transportMock = jest.fn();

// The indexer sends each proof component as a JSON array of bytes
const bytes = (length: number) => Array.from({ length }, (_, i) => i + 1);

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
      compressedProof: { a: bytes(32), b: bytes(64), c: bytes(32) },
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
    expect(result.value.compressedProof.a).toHaveLength(32);
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
          compressedProof: { a: bytes(32), b: bytes(64), c: bytes(32) },
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

  it("Types the proof components as the byte arrays the indexer sends", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: {
        context: { slot: 0 },
        value: {
          compressedProof: { a: bytes(32), b: bytes(64), c: bytes(32) },
          leafIndices: [6],
          leaves: ["JReC6h68m3EdCKP7S35e7BE4pBPwQz1HfjUkboeQy9r"],
          merkleTrees: ["smt1NamzXdq4AMqS2fS2F1i5KTYPZRhoHgWx38d8WsT"],
          rootIndices: [7],
          roots: ["2wBDKLscN4SBNzNdVsHq17PVXycvM8n4LNiKzJrebqZ7"],
        },
      },
    });

    const res = await helius.zk.getValidityProof({
      hashes: ["JReC6h68m3EdCKP7S35e7BE4pBPwQz1HfjUkboeQy9r"],
    });
    const { a, b, c } = res.value.compressedProof;

    expect(Uint8Array.from(a)).toHaveLength(32);
    expect(Uint8Array.from(b)).toHaveLength(64);
    expect(Uint8Array.from(c)).toHaveLength(32);
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
