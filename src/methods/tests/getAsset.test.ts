import { createSolanaRpc } from "@solana/kit";
import { installGetAsset } from "../getAsset";
import type { Asset } from "../../types/das";
import { Interface, OwnershipModel } from "../../types/das";

jest.mock("@solana/kit", () => ({
  createSolanaRpc: jest.fn().mockImplementation(() => ({
    request: jest.fn(),
  })),
}));

describe("getAsset Tests", () => {
  const rpc = createSolanaRpc("fake-holocron-url") as any;
  installGetAsset(rpc);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Successfully fetches an asset by its ID", async () => {
    const mockAsset: Asset = {
      interface: Interface.ProgrammableNFT, 
      id: "kyber-crystal-1138",
      content: {
        $schema: "jedi-metadata",
        json_uri: "https://starwars.com/kyber.json",
        metadata: {
          name: "Luke's Lightsaber",
          description: "A weapon for a more civilized age",
          attributes: [{ trait_type: "Color", value: "Green" }],
          symbol: "SABER",
          token_standard: "nonFungible",
        },
        links: {
          image: "https://starwars.com/lightsaber.png",
        },
      },
      ownership: { frozen: false, delegated: false, ownership_model: OwnershipModel.Single, owner: "lukeskywalker.sol" },
      mutable: true,
      burnt: false,
    };

    (rpc.request as jest.Mock).mockResolvedValue(mockAsset);

    const result = await rpc.getAsset("kyber-crystal-1138");
    expect(result).toEqual(mockAsset);
    expect(rpc.request).toHaveBeenCalledWith("getAsset", { id: "kyber-crystal-1138" });
  });
});