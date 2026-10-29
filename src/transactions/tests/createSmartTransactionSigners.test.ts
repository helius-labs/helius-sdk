import {
  address,
  blockhash,
  createKeyPairSignerFromPrivateKeyBytes,
  getBase64Encoder,
  getPublicKeyFromAddress,
  getTransactionDecoder,
  verifySignature,
  type Instruction,
  type Transaction,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import { makeCreateSmartTransaction } from "../createSmartTransaction";
import type { CreateSmartTxDeps } from "../types";

const makeSigner = (seed: number) =>
  createKeyPairSignerFromPrivateKeyBytes(new Uint8Array(32).fill(seed));

const expectValidSignatures = async (transaction: Transaction) => {
  for (const [signerAddress, signature] of Object.entries(
    transaction.signatures
  )) {
    expect(signature).not.toBeNull();
    expect(
      await verifySignature(
        await getPublicKeyFromAddress(address(signerAddress)),
        signature!,
        transaction.messageBytes
      )
    ).toBe(true);
  }
};

const makeDeps = () => ({
  raw: {
    getLatestBlockhash: jest.fn(() => ({
      send: async () => ({
        value: {
          blockhash: blockhash("11111111111111111111111111111111"),
          lastValidBlockHeight: 100n,
        },
      }),
    })),
  } as unknown as CreateSmartTxDeps["raw"],
  getComputeUnits: jest.fn().mockResolvedValue(2_000),
  getPriorityFeeEstimate: jest
    .fn()
    .mockResolvedValue({ priorityFeeEstimate: 1 }),
});

const withoutSigners = (
  instruction: ReturnType<typeof getTransferSolInstruction>
): Instruction => ({
  ...instruction,
  accounts: instruction.accounts.map(({ address, role }) => ({
    address,
    role,
  })),
});

describe("createSmartTransaction supplied signers", () => {
  it.each(["legacy", 0, 1] as const)(
    "Signs plain instruction accounts using the signers array for version %s",
    async (version) => {
      const payer = await makeSigner(1);
      const source = await makeSigner(2);
      const unused = await makeSigner(3);
      const instruction = withoutSigners(
        getTransferSolInstruction({
          source,
          destination: payer.address,
          amount: 1n,
        })
      );
      const deps = makeDeps();
      const { create } = makeCreateSmartTransaction(deps);
      const result = await create({
        instructions: [instruction],
        signers: [payer, source, unused],
        version,
      });

      expect(Object.keys(result.signed.signatures).sort()).toEqual(
        [payer.address, source.address].sort()
      );
      await expectValidSignatures(result.signed);
      // Adding signers must not mutate the caller's account metadata.
      expect(
        instruction.accounts?.every((account) => !("signer" in account))
      ).toBe(true);
      if (version !== 1) {
        const estimateInput = deps.getPriorityFeeEstimate.mock.calls[0][0];
        const draft = getTransactionDecoder().decode(
          getBase64Encoder().encode(estimateInput.transaction)
        );
        expect(Object.keys(draft.signatures).sort()).toEqual(
          [payer.address, source.address].sort()
        );
        await expectValidSignatures(draft);
      }
    }
  );

  it("Respects an explicit payer and an already attached instruction signer", async () => {
    const payer = await makeSigner(1);
    const source = await makeSigner(2);
    const unused = await makeSigner(3);
    const { create } = makeCreateSmartTransaction(makeDeps());
    const result = await create({
      signers: [unused, payer],
      feePayer: payer.address,
      instructions: [
        getTransferSolInstruction({
          source,
          destination: payer.address,
          amount: 1n,
        }),
      ],
    });
    expect(result.message.feePayer.address).toBe(payer.address);
    expect(Object.keys(result.signed.signatures).sort()).toEqual(
      [payer.address, source.address].sort()
    );
    await expectValidSignatures(result.signed);
  });

  it("Uses an explicit payer signer supplied separately from the signers array", async () => {
    const payer = await makeSigner(1);
    const source = await makeSigner(2);
    const { create } = makeCreateSmartTransaction(makeDeps());
    const result = await create({
      signers: [source],
      feePayer: payer,
      instructions: [
        withoutSigners(
          getTransferSolInstruction({
            source,
            destination: payer.address,
            amount: 1n,
          })
        ),
      ],
    });
    expect(result.message.feePayer.address).toBe(payer.address);
    await expectValidSignatures(result.signed);
  });

  it("Still rejects when a required instruction signer is missing", async () => {
    const payer = await makeSigner(1);
    const source = await makeSigner(2);
    const { create } = makeCreateSmartTransaction(makeDeps());
    await expect(
      create({
        signers: [payer],
        instructions: [
          withoutSigners(
            getTransferSolInstruction({
              source,
              destination: payer.address,
              amount: 1n,
            })
          ),
        ],
      })
    ).rejects.toThrow(/signature/i);
  });
});
