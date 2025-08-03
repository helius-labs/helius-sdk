import { address, type TransactionSigner } from "@solana/kit";

import { makeGetStakeInstructions } from "../getStakeInstructions";
import { makeGetUnstakeInstruction } from "../getUnstakeInstruction";
import { makeGetWithdrawInstruction } from "../getWithdrawInstruction";

const mockRentSend = jest.fn().mockResolvedValue(2_000_000n);
const dummyRpc: any = {
  getMinimumBalanceForRentExemption: jest
    .fn()
    .mockReturnValue({ send: mockRentSend }),
  getLatestBlockhash: jest
    .fn()
    .mockReturnValue({ send: () => ({ value: { blockhash: "" } }) }),
};

// Valid dummy keys
const ownerAddr = address("5T5F5kjo3Ctu6E1GXzCsmBUNgRwRPHG5op2YmZ1d1m8j");
const stakeAddr = address("88qXF1RQ2QxAo6MsyDj3kX9XgCqcSfetNU9oM5Y8k8qC");
const recipAddr = address("6Dj3fNcRKFvxcHsk89o1g1bj9W6cx59i9SzS95pEmBvS");

const ownerSigner: TransactionSigner<string> = { address: ownerAddr } as any;

describe("Stake Instruction Helpers Tests", () => {
  it("Produces create + init + delegate ixs", async () => {
    const { instructions, stakeAccount } = await makeGetStakeInstructions({
      rpc: dummyRpc,
    })(ownerSigner, 0.01);

    expect(instructions).toHaveLength(3);
    expect(stakeAccount.address).toBeDefined();
  });

  it("Produces a single deactivate instruction", () => {
    const ix = makeGetUnstakeInstruction()(ownerAddr, stakeAddr);
    expect(ix.programAddress).toMatch(/Stake/);
  });

  it("Produces a single withdraw instruction", () => {
    const ix = makeGetWithdrawInstruction()(
      ownerAddr,
      stakeAddr,
      recipAddr,
      999_999n
    );
    expect(ix.programAddress).toMatch(/Stake/);
  });
});
