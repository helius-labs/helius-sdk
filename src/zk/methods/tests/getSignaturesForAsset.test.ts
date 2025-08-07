import { createHelius } from "../../../rpc";
import { GetSignaturesForAssetResponse, SignatureOpPair } from "../../types";

const transportMock = jest.fn();

jest.mock("@solana/kit", () => ({
  createSolanaRpcApi: jest.fn().mockReturnValue({}),
  DEFAULT_RPC_CONFIG: {},
  createDefaultRpcTransport: jest.fn(() => transportMock),
  createRpc: jest.fn().mockReturnValue({}),
  createSolanaRpcSubscriptions: jest.fn().mockReturnValue({}),
}));

describe("getSignaturesForAsset Tests", () => {
  let helius: ReturnType<typeof createHelius>;
  const FALCON_ASSET_ID = "MillenniumFalcon1111111111111111111111111111111";

  beforeEach(() => {
    jest.clearAllMocks();
    transportMock.mockReset();
    helius = createHelius({ apiKey: "parsecs-12-or-less" });
  });

  it("Retrieves a paginated flight log", async () => {
    const sampleItems: SignatureOpPair[] = [
      [
        "5pR9eLpQvYgukMhRhzDeatH4NBRXQ8ZDhHtZXwGdBa4J3TX6wu9PnCg982L",
        "MintToCollectionV1",
      ],
      [
        "4HothBaseSupplyDropZ9o7uPukzpx9nEtBEDzKbQZpKn2Tb4FF4tPkKmQ4",
        "Transfer",
      ],
    ];

    const mockResult: GetSignaturesForAssetResponse = {
      total: 2,
      limit: 1000,
      items: sampleItems,
    };

    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      result: mockResult,
    });

    const res = await helius.zk.getSignaturesForAsset({
      id: FALCON_ASSET_ID,
      page: 1,
    });

    expect(res.items).toHaveLength(2);
    expect(res.items[0][1]).toBe("MintToCollectionV1");

    expect(transportMock).toHaveBeenCalledWith(
      expect.objectContaining({
        payload: expect.objectContaining({
          method: "getSignaturesForAsset",
          params: { id: FALCON_ASSET_ID, page: 1 },
        }),
      })
    );
  });

  it("Bubbles up RPC errors", async () => {
    transportMock.mockResolvedValue({
      jsonrpc: "2.0",
      id: "1",
      error: { code: -32004, message: "No signatures found" },
    });

    await expect(
      helius.zk.getSignaturesForAsset({ id: FALCON_ASSET_ID, page: 1 })
    ).rejects.toThrow(/signatures/i);
  });
});
