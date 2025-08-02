import { address, type Instruction, type TransactionSigner } from "@solana/kit";

const mockStakeSigner: TransactionSigner<string> = {
  address: address("4RiZvuXvR5dr6VtUCaQhyE355sWJ5kJy7N8PwegmnPHS"),
} as any;

const ownerSigner: TransactionSigner<string> = {
  address: address("8beY2iKosqhApSsWwJ5JTyxzVnMqxarJbYdrHgRUKYPx"),
} as any;

const mockGenKeyPair = jest.fn().mockResolvedValue(mockStakeSigner);
const mockSignTx = jest.fn(async (_msg: any) => ({
  signed: true,
  _msg,
}));
const mockBase64Encode = jest.fn().mockReturnValue("TX64");

jest.mock("@solana/kit", () => {
  const actual = jest.requireActual("@solana/kit");
  return {
    ...actual,
    generateKeyPairSigner: () => mockGenKeyPair(),
    signTransactionMessageWithSigners: (msg: any) => mockSignTx(msg),
    getBase64EncodedWireTransaction: (tx: any) => mockBase64Encode(tx),
  };
});

import { makeCreateStakeTransaction } from "../createStakeTransaction";

const STAKE_STATE_LEN = 200;
const SYSTEM_PROGRAM = address("11111111111111111111111111111111");
const STAKE_PROGRAM = address("Stake11111111111111111111111111111111111111");

const mockRentSend = jest.fn().mockResolvedValue(400_000n);
const mockHashSend = jest.fn().mockResolvedValue({
  value: {
    blockhash: "HyPeRblockHash1111111111111111111111111" as any,
    lastValidBlockHeight: 123n,
  },
});

const mockRpc: any = {
  getMinimumBalanceForRentExemption: jest.fn().mockReturnValue({
    send: mockRentSend,
  }),
  getLatestBlockhash: jest.fn().mockReturnValue({
    send: mockHashSend,
  }),
};

describe("makeCreateStakeTransaction Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("builds + fully signs a stake‑creation transaction", async () => {
    const { serializedTx, stakeAccountPubkey } =
      await makeCreateStakeTransaction({ rpc: mockRpc })(
        ownerSigner,
        0.001 // 0.001 SOL stake (user amount)
      );

    expect(mockRpc.getMinimumBalanceForRentExemption).toHaveBeenCalledWith(
      BigInt(STAKE_STATE_LEN)
    );
    expect(mockRpc.getLatestBlockhash).toHaveBeenCalledTimes(1);
    expect(mockGenKeyPair).toHaveBeenCalledTimes(1);
    expect(mockSignTx).toHaveBeenCalledTimes(1);
    expect(mockBase64Encode).toHaveBeenCalledTimes(1);

    expect(serializedTx).toBe("TX64");
    expect(stakeAccountPubkey).toBe(mockStakeSigner.address);

    const signedArg = mockSignTx.mock.calls[0][0]; // First arg of the first call
    const programIds = (
      signedArg.instructions as Instruction<string, readonly any[]>[]
    ).map((ix) => ix.programAddress);

    // It should contain the System Program (create‑account) + Stake Program (init + delegate)
    expect(programIds).toEqual([
      SYSTEM_PROGRAM, // createAccount
      STAKE_PROGRAM, // initialize
      STAKE_PROGRAM, // delegate
    ]);
  });
});
