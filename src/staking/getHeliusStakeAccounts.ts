import { Address, Base58EncodedBytes, Rpc, SolanaRpcApi } from "@solana/kit";
import { HELIUS_VALIDATOR_ID, STAKE_PROGRAM_ID } from "./types";

export const makeGetHeliusStakeAccounts = ({
  rpc,
}: {
  rpc: Rpc<SolanaRpcApi>;
}) => {
  return async (wallet: Address | string): Promise<any[]> => {
    const walletStr = wallet.toString();

    const accounts = await rpc
      .getProgramAccounts(STAKE_PROGRAM_ID, {
        encoding: "jsonParsed",
        filters: [
          {
            memcmp: {
              offset: 44n,
              bytes: walletStr as Base58EncodedBytes,
              encoding: "base58",
            },
          },
        ],
      })
      .send();

    return accounts.filter(
      (acc: any) =>
        acc.account?.data?.parsed?.info?.stake?.delegation?.voter ===
        HELIUS_VALIDATOR_ID
    );
  };
};
