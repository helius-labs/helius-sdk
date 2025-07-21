import type { Asset } from "../../types/das";

export type GetAssetApi = {
    getAsset(id: string): Asset;
    getAsset(args: { id: string; options?: { showFungible?: boolean } }): Asset;
};  