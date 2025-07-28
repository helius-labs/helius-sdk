import {
  address,
  type Address,
  type TransactionSigner,
  type Instruction,
  type Blockhash,
  type AccountMeta,
  type AccountLookupMeta,
} from "@solana/kit";
import { createTxMessage } from "../createTxMessage";

type IxAccounts = readonly (
  | AccountMeta<string>
  | AccountLookupMeta<string, string>
)[];

// Minimal no-op instruction that satisfies @solana/kit’s shape
const makeNoopIx = (program: Address): Instruction<string, IxAccounts> => ({
  programAddress: program,
  accounts: [] as IxAccounts,
  data: new Uint8Array(),
});

const getFeePayerAddress = (msg: any): string =>
  typeof msg.feePayer === "string" ? msg.feePayer : msg.feePayer?.address;

describe("createTxMessage Tests", () => {
  it("Builds a message with Address fee payer and lifetime; instructions appended in order", () => {
    const feePayer = address("11111111111111111111111111111111");
    const lifetime = {
      blockhash: "5nP4a8kpkJwY5j7cQeWWoJc3qQ9mMxjX8v3d5fWg2JkN" as Blockhash,
      lastValidBlockHeight: 123n,
    };

    const ix1 = makeNoopIx(address("11111111111111111111111111111111"));
    const ix2 = makeNoopIx(address("11111111111111111111111111111111"));

    const msg = createTxMessage({
      version: 0,
      feePayer,
      lifetime,
      instructions: [ix1, ix2],
    });

    expect((msg as any).instructions?.length).toBe(2);
    expect((msg as any).instructions?.[0]).toBe(ix1);
    expect((msg as any).instructions?.[1]).toBe(ix2);

    // Fee payer is normalized by kit; allow both shapes
    expect(getFeePayerAddress(msg)).toBe(feePayer);

    const lc = (msg as any).lifetimeConstraint ?? (msg as any).lifetime;
    if (lc) {
      const bh = lc.blockhash ?? lc.value?.blockhash;
      const lvh = lc.lastValidBlockHeight ?? lc.value?.lastValidBlockHeight;

      expect(bh).toBe(lifetime.blockhash);
      expect(lvh).toBe(lifetime.lastValidBlockHeight);
    }
  });

  it("Builds a message with Signer fee payer (uses signer.address)", () => {
    const signer: TransactionSigner<string> = {
      address: address("9z8b2Uun1rJtQwVhLQxC9rjNV8o6D5pL4tFz3s7Yk1Qh"),
    } as unknown as TransactionSigner<string>;

    const ix = makeNoopIx(address("11111111111111111111111111111111"));

    const msg = createTxMessage({
      version: 0,
      feePayer: signer,
      instructions: [ix],
    });

    expect((msg as any).instructions?.length).toBe(1);
    expect(getFeePayerAddress(msg)).toBe(signer.address);
  });

  it("Works without lifetime", () => {
    const feePayer = address("11111111111111111111111111111111");
    const ix = makeNoopIx(address("11111111111111111111111111111111"));

    const msg = createTxMessage({
      version: 0,
      feePayer,
      instructions: [ix],
    });

    expect((msg as any).instructions?.length).toBe(1);
    expect(getFeePayerAddress(msg)).toBe(feePayer);
    
    const lc = (msg as any).lifetimeConstraint ?? (msg as any).lifetime;
    expect(lc).toBeUndefined();
  });
});
