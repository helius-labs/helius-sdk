import {
  address,
  type Address,
  type Instruction,
  type TransactionSigner,
  generateKeyPairSigner,
} from "@solana/kit";
import {
  getSetComputeUnitLimitInstruction,
  getSetComputeUnitPriceInstruction,
} from "@solana-program/compute-budget";

// Mocks for @solana/kit bits used by createSmartTransaction
// We only override what the SUT uses: sign + base64 encoder
// Everything else falls back to the real module
const mockSign = jest.fn(async (msg: any) => ({ signed: true, msg }));
const mockBase64 = jest.fn();

jest.mock("@solana/kit", () => {
  const actual = jest.requireActual("@solana/kit");
  return {
    ...actual,
    // SUT calls sign(msg) and getBase64(signedTx): we stub that exact shape
    signTransactionMessageWithSigners: (msg: any) => mockSign(msg),
    getBase64EncodedWireTransaction: (tx: any) => mockBase64(tx),
  };
});

import { makeCreateSmartTransaction } from "../createSmartTransaction";

// Minimal no-op instruction that satisfies @solana/kit’s shape
const makeNoopIx = (program: Address): Instruction<string, readonly any[]> => ({
  programAddress: program,
  accounts: [],
  data: new Uint8Array(),
});

// Extract program addresses from a compilable message
const programAddrs = (msg: any): string[] =>
  (msg.instructions ?? []).map((ix: any) => ix.programAddress);

// Dummy signer (no private key needed because we stub signing)
const feePayerSigner: TransactionSigner<string> = {
  address: address("FEEoAYErFEEPAYeR111111111111111111111111111"),
} as any;

const CB_ADDR = getSetComputeUnitLimitInstruction({ units: 1 }).programAddress;

const lifetimeA = {
  blockhash: "HyPerSpAceHashAaaaaaaaaaaaaaaaaaaaaaaaaaaaaa" as any,
  lastValidBlockHeight: 123n,
};

const lifetimeB = {
  blockhash: "HyPerSpAceHashBbbbbbbbbbbbbbbbbbbbbbbbbbbbbb" as any,
  lastValidBlockHeight: 456n,
};

describe("createSmartTransaction Tests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("Builds, signs, estimates, caps fees, refreshes blockhash, and prepends compute-budget ixs", async () => {
    const sendDraft = jest.fn().mockResolvedValue({ value: lifetimeA });
    const sendFinal = jest.fn().mockResolvedValue({ value: lifetimeB });
    const getLatestBlockhash = jest
      .fn()
      .mockReturnValueOnce({ send: sendDraft })
      .mockReturnValueOnce({ send: sendFinal });

    const raw: any = { getLatestBlockhash };

    const getComputeUnits = jest.fn().mockResolvedValue(42_000);

    const getPriorityFeeEstimate = jest
      .fn()
      .mockResolvedValue({ priorityFeeEstimate: 10_000 });

    mockBase64
      .mockReturnValueOnce("BASE64_DRAFT_TX")
      .mockReturnValueOnce("BASE64_FINAL_TX");

    const { create } = makeCreateSmartTransaction({
      raw,
      getComputeUnits,
      getPriorityFeeEstimate,
    });

    const userIx = makeNoopIx(address("11111111111111111111111111111111"));
    const userSuppliedBudgetIx = getSetComputeUnitPriceInstruction({
      microLamports: 999,
    });
    const instructions = [userIx, userSuppliedBudgetIx];

    const result = await create({
      signers: [feePayerSigner],
      instructions,
      version: 0,
      commitment: "confirmed",
      priorityFeeCap: 7_000, // Cap below recommendation → should clamp
    });

    expect(getLatestBlockhash).toHaveBeenCalledTimes(2);
    expect(sendDraft).toHaveBeenCalled();
    expect(sendFinal).toHaveBeenCalled();
    expect(getComputeUnits).toHaveBeenCalledTimes(1);
    // cannot deep-equal the message easily, but we know it was called

    expect(mockSign).toHaveBeenCalled(); // Draft sign
    expect(mockBase64).toHaveBeenCalledWith(
      expect.objectContaining({ signed: true, msg: expect.anything() })
    );
    expect(getPriorityFeeEstimate).toHaveBeenCalledWith({
      transaction: "BASE64_DRAFT_TX",
      options: { transactionEncoding: "base64", recommended: true },
    });
    expect(result.priorityFee).toBe(7_000);

    const addrs = programAddrs(result.message);
    expect(addrs.length).toBe(1 /* user ix */ + 2 /* our CB ixs */);
    expect(addrs[0]).toBe(CB_ADDR); // Price
    expect(addrs[1]).toBe(CB_ADDR); // Limit
    expect(addrs[2]).toBe(userIx.programAddress); // User's ix

    // Lifetime is refreshed to B (not the draft A)
    expect(result.lifetime).toEqual(lifetimeB);

    // Final is signed and encoded to base64 returned to caller
    expect(result.base64).toBe("BASE64_FINAL_TX");
    expect(result.units).toBe(42_000);
  });

  it("Resolves fee payer override given as Address to the matching signer", async () => {
    const sendOnce = jest.fn().mockResolvedValue({ value: lifetimeA });
    const raw: any = {
      getLatestBlockhash: jest.fn().mockReturnValue({ send: sendOnce }),
    };
    const getComputeUnits = jest.fn().mockResolvedValue(1_000);
    const getPriorityFeeEstimate = jest
      .fn()
      .mockResolvedValue({ priorityFeeEstimate: 500 });

    const { create } = makeCreateSmartTransaction({
      raw,
      getComputeUnits,
      getPriorityFeeEstimate,
    });

    const altSigner = await generateKeyPairSigner();

    const result = await create({
      signers: [altSigner],
      feePayer: altSigner.address,
      instructions: [makeNoopIx(address("11111111111111111111111111111111"))],
    });

    const addrs = programAddrs(result.message);
    expect(addrs.length).toBe(3); // 2 CB + 1 user
  });

  it("Throws if feePayer override (Address) has no matching signer", async () => {
    const sendOnce = jest.fn().mockResolvedValue({ value: lifetimeA });
    const raw: any = {
      getLatestBlockhash: jest.fn().mockReturnValue({ send: sendOnce }),
    };
    const getComputeUnits = jest.fn().mockResolvedValue(1_000);
    const getPriorityFeeEstimate = jest
      .fn()
      .mockResolvedValue({ priorityFeeEstimate: 500 });

    const { create } = makeCreateSmartTransaction({
      raw,
      getComputeUnits,
      getPriorityFeeEstimate,
    });

    await expect(
      create({
        signers: [feePayerSigner],
        feePayer: address("11111111111111111111111111111111"),
        instructions: [makeNoopIx(address("11111111111111111111111111111111"))],
      })
    ).rejects.toThrow(/no matching TransactionSigner/i);
  });
});
