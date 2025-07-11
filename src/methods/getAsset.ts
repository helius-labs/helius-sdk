import type { Rpc } from "@solana/kit";
import type { Asset } from "../types/das";

export interface GetAssetApi {
    getAsset(id: string): Promise<Asset>;
    getAsset(params: { id: string }): Promise<Asset>;
}

export const installGetAsset: <T extends Rpc<unknown> & { request<Result>(method: string, params: unknown): Promise<Result>; }>(
  rpc: T,
) => asserts rpc is T & Rpc<GetAssetApi> = (rpc) => {
  const getAsset = (argsOrId: { id: string } | string) => {
    const params = typeof argsOrId === "string" ? { id: argsOrId } : argsOrId;
    return rpc.request<Asset>("getAsset", params);
  };  (rpc as any).getAsset = getAsset;
};

