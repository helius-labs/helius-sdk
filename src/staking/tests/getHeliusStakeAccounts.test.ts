import { address, Base58EncodedBytes } from "@solana/kit";

import { makeGetHeliusStakeAccounts } from "../getHeliusStakeAccounts";
import { HELIUS_VALIDATOR_ID, STAKE_PROGRAM_ID } from "../types";

const WALLET = address("8beY2iKosqhApSsWwJ5JTyxzVnMqxarJbYdrHgRUKYPx");

const mkStakeAcc = (voter: string) => ({
  pubkey: address(voter),
  account: {
    data: {
      parsed: {
        info: {
          stake: { delegation: { voter } },
        },
      },
    },
  },
});

const HELIUS_ACC = mkStakeAcc(HELIUS_VALIDATOR_ID);
const OTHER_ACC = mkStakeAcc("Vote111111111111111111111111111111111111111");

const mockSend = jest.fn().mockResolvedValue([HELIUS_ACC, OTHER_ACC]);
const mockRpc: any = {
  getProgramAccounts: jest.fn().mockReturnValue({ send: mockSend }),
};

describe("getHeliusStakeAccounts Tests", () => {
  beforeEach(() => jest.clearAllMocks());

  it("Returns only stake accounts delegated to Helius", async () => {
    const fn = makeGetHeliusStakeAccounts({ rpc: mockRpc });

    const res = await fn(WALLET);

    expect(mockRpc.getProgramAccounts).toHaveBeenCalledWith(
      STAKE_PROGRAM_ID,
      expect.objectContaining({
        encoding: "jsonParsed",
        filters: [
          {
            memcmp: {
              offset: 44n,
              bytes: WALLET.toString() as Base58EncodedBytes,
              encoding: "base58",
            },
          },
        ],
      })
    );

    expect(res).toEqual([HELIUS_ACC]);
  });
});
