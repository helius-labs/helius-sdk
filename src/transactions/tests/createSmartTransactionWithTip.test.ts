import {
  address,
  type Address,
  type Instruction,
  type TransactionSigner,
  lamports,
  generateKeyPairSigner,
} from "@solana/kit";

import { makeCreateSmartTransactionWithTip } from "../createSmartTransactionWithTip";

jest.mock("@solana-program/system", () => ({
  getTransferSolInstruction: jest.fn(() => ({ __tip: true })),
}));
import { getTransferSolInstruction } from "@solana-program/system";

const BASE_RESULT: any = { ok: true };
const baseBuilder = jest.fn().mockResolvedValue(BASE_RESULT);

const makeNoopIx = (program: Address): Instruction<string, readonly any[]> => ({
  programAddress: program,
  accounts: [],
  data: new Uint8Array(),
});

const feePayerSigner: TransactionSigner<string> = {
  address: address("FEEoAYErFEEPAYeR111111111111111111111111111"),
} as any;

describe("createSmartTransactionWithTip", () => {
  const { create } = makeCreateSmartTransactionWithTip(baseBuilder);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Appends a Jito tip instruction and forwards everything to the base builder", async () => {
    const userIx = makeNoopIx(address("11111111111111111111111111111111"));

    const result = await create({
      signers: [feePayerSigner],
      instructions: [userIx],
    });

    expect(result).toBe(BASE_RESULT);

    const tipIx = (getTransferSolInstruction as jest.Mock).mock.results[0]
      .value;
    const forwarded = baseBuilder.mock.calls[0][0];
    expect(forwarded.instructions).toEqual([userIx, tipIx]);
  });

  it("Honours a custom tip amount and feePayer override (Address)", async () => {
    const altSigner = await generateKeyPairSigner();

    await create({
      signers: [feePayerSigner, altSigner],
      feePayer: altSigner.address,
      instructions: [],
      tipAmount: 2_345,
    });

    expect(getTransferSolInstruction).toHaveBeenCalledWith(
      expect.objectContaining({
        source: altSigner,
        amount: lamports(2_345n),
      })
    );
  });

  it("Throws when fee payer cannot be resolved", async () => {
    const stranger = await generateKeyPairSigner();

    await expect(
      create({
        signers: [feePayerSigner],
        feePayer: stranger.address,
        instructions: [],
      })
    ).rejects.toThrow(/could not resolve a fee payer signer/i);
  });
});