import { address, KeyPairSigner, type Instruction } from "@solana/kit";

const ownerSigner: KeyPairSigner<string> = {
  address: address("8beY2iKosqhApSsWwJ5JTyxzVnMqxarJbYdrHgRUKYPx"),
} as any;

const stakeAccount = address("4RiZvuXvR5dr6VtUCaQhyE355sWJ5kJy7N8PwegmnPHS");

const mockSignTx = jest.fn(async (msg: any) => ({ signed: true, msg }));
const mockBase64Encode = jest.fn().mockReturnValue("TX64");

jest.mock("@solana/kit", () => {
  const actual = jest.requireActual("@solana/kit");
  return {
    ...actual,
    signTransactionMessageWithSigners: (msg: any) => mockSignTx(msg),
    getBase64EncodedWireTransaction: (tx: any) => mockBase64Encode(tx),
  };
});

const mockHashSend = jest.fn().mockResolvedValue({
  value: {
    blockhash: "HyPeRblockHash1111111111111111111111111" as any,
    lastValidBlockHeight: 123n,
  },
});
const mockRpc: any = {
  getLatestBlockhash: jest.fn().mockReturnValue({ send: mockHashSend }),
};

import { makeCreateUnstakeTransaction } from "../createUnstakeTransaction";
import { STAKE_PROGRAM_ID } from "../types";

describe("makeCreateUnstakeTransaction Tests", () => {
  beforeEach(() => jest.clearAllMocks());

  it("Builds + signs a deactivate stake transaction", async () => {
    const { serializedTx } = await makeCreateUnstakeTransaction({
      rpc: mockRpc,
    })(ownerSigner, stakeAccount);

    expect(mockRpc.getLatestBlockhash).toHaveBeenCalledTimes(1);
    expect(mockHashSend).toHaveBeenCalledTimes(1);

    expect(mockSignTx).toHaveBeenCalledTimes(1);
    expect(mockBase64Encode).toHaveBeenCalledTimes(1);
    expect(serializedTx).toBe("TX64");

    const signedArg = mockSignTx.mock.calls[0][0];
    const programIds = (
      signedArg.instructions as Instruction<string, readonly any[]>[]
    ).map((ix) => ix.programAddress);

    expect(programIds).toEqual([STAKE_PROGRAM_ID]); // Single Deactivate ix
  });
});
