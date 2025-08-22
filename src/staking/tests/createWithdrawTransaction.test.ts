import { address, KeyPairSigner, type Instruction } from "@solana/kit";

const withdrawAuthority: KeyPairSigner<string> = {
  address: address("8beY2iKosqhApSsWwJ5JTyxzVnMqxarJbYdrHgRUKYPx"),
} as any;

const stakeAccount = address("4RiZvuXvR5dr6VtUCaQhyE355sWJ5kJy7N8PwegmnPHS");
const destination = address("H7jKsT45CRkZZzF1y3Dp8TfxKh3ZrGdtMt5QKZKpXn21");
const STAKE_PROGRAM = address("Stake11111111111111111111111111111111111111");

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
    lastValidBlockHeight: 321n,
  },
});
const mockRpc: any = {
  getLatestBlockhash: jest.fn().mockReturnValue({ send: mockHashSend }),
};

import { makeCreateWithdrawTransaction } from "../createWithdrawTransaction";

describe("makeCreateWithdrawTransaction Tests", () => {
  beforeEach(() => jest.clearAllMocks());

  it("Builds + signs a withdraw from stake transaction", async () => {
    const lamports = 123_456n;

    const { serializedTx } = await makeCreateWithdrawTransaction({
      rpc: mockRpc,
    })(withdrawAuthority, stakeAccount, destination, lamports);

    expect(mockRpc.getLatestBlockhash).toHaveBeenCalledTimes(1);
    expect(mockHashSend).toHaveBeenCalledTimes(1);

    expect(mockSignTx).toHaveBeenCalledTimes(1);
    expect(mockBase64Encode).toHaveBeenCalledTimes(1);
    expect(serializedTx).toBe("TX64");

    const signedArg = mockSignTx.mock.calls[0][0];
    const ixArray = signedArg.instructions as Instruction<
      string,
      readonly any[]
    >[];

    expect(ixArray.length).toBe(1); // Only one ix
    expect(ixArray[0].programAddress).toBe(STAKE_PROGRAM);

    const data = ixArray[0].data;
    expect(data!.length).toBeGreaterThan(0);
  });
});
