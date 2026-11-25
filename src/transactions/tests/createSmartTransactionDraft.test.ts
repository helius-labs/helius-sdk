import {
  blockhash,
  createKeyPairSignerFromPrivateKeyBytes,
  getBase64Encoder,
  getCompiledTransactionMessageDecoder,
  getTransactionDecoder,
} from "@solana/kit";
import { getTransferSolInstruction } from "@solana-program/system";
import { makeCreateSmartTransaction } from "../createSmartTransaction.js";
import { makeGetComputeUnits } from "../getComputeUnits.js";

/**
 * The draft message carries a placeholder blockhash instead of a fetched one.
 * That is only safe because kit's compute-unit estimator simulates with
 * `replaceRecentBlockhash: true`. These tests run the real estimator (no kit
 * mocks) so a kit upgrade that changes that default fails here, rather than
 * as `BlockhashNotFound` on every smart transaction.
 */
describe("createSmartTransaction draft simulation (real kit estimator)", () => {
  const fetched = {
    blockhash: blockhash("4vJ9JU1bJJE96FWSJKvHsmmFADCg4gpZQff4P3bkLKi"),
    lastValidBlockHeight: 500n,
  };

  const makeRaw = () => ({
    getLatestBlockhash: jest.fn(() => ({
      send: async () => ({ value: fetched }),
    })),
    simulateTransaction: jest.fn(() => ({
      send: async () => ({ value: { err: null, unitsConsumed: 5_000n } }),
    })),
  });

  it.each(["legacy", 0, 1] as const)(
    "simulates the placeholder-blockhash draft with replaceRecentBlockhash on version %s",
    async (version) => {
      const payer = await createKeyPairSignerFromPrivateKeyBytes(
        new Uint8Array(32).fill(1)
      );
      const raw = makeRaw();
      const { create } = makeCreateSmartTransaction({
        raw: raw as any,
        getComputeUnits: makeGetComputeUnits(raw as any),
        getPriorityFeeEstimate: jest
          .fn()
          .mockResolvedValue({ priorityFeeEstimate: 1 }),
      });

      const result = await create({
        signers: [payer],
        instructions: [
          getTransferSolInstruction({
            source: payer,
            destination: payer.address,
            amount: 1n,
          }),
        ],
        version,
      });

      expect(raw.simulateTransaction).toHaveBeenCalledTimes(1);
      const [wire, config] = raw.simulateTransaction.mock
        .calls[0] as unknown as [string, Record<string, unknown>];
      expect(config).toMatchObject({
        replaceRecentBlockhash: true,
        sigVerify: false,
      });

      // The simulated draft carries the placeholder, not a fetched blockhash
      const draft = getCompiledTransactionMessageDecoder().decode(
        getTransactionDecoder().decode(getBase64Encoder().encode(wire))
          .messageBytes
      );
      expect(draft.lifetimeToken).toBe("11111111111111111111111111111111");

      // While the transaction itself gets the fetched one
      expect(result.lifetime).toEqual(fetched);
      expect(raw.getLatestBlockhash).toHaveBeenCalledTimes(1);
    }
  );
});
